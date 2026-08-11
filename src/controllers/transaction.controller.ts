// src/controllers/transaction.controller.ts
import type { Request, Response } from 'express'
import db from '../config/db.js'
import { Transaction, Client, TransDetail, Inventory, Product, Warehouse, PaymentHistory, TransDestAcc, TransCourier, TransUser, User, Courier } from '../models/index.js'

// Include completo para mandar al frontend todo lo que necesitan
// UpdateOrder_Page / OrderDetail_Page / OrdersReports_Page: cliente, renglones
// con su producto, historial de pagos (+ quién cobró cada uno), vendedor
// (quien la registró, vía transUser) y repartidor (vía transCourier).
// `attributes` en User evita mandar el hash de la contraseña.
const FULL_TRANSACTION_INCLUDE = [
    Client,
    { model: TransDetail, include: [Product] },
    { model: PaymentHistory, include: [{ model: User, as: 'collectedBy', attributes: ['userID', 'userName'] }] },
    { model: User, attributes: ['userID', 'userName'] },
    Courier,
]

// Include liviano para listados (getTransactions): cliente, vendedor y
// repartidor — lo que pintan UpdateOrder_Page/OrdersReports_Page/SalesReport_Page
// en sus tablas. Sin TransDetail/PaymentHistory a propósito (esos son pesados
// y solo hacen falta en el detalle de una transacción, vía FULL_TRANSACTION_INCLUDE).
const LIST_TRANSACTION_INCLUDE = [
    Client,
    { model: User, attributes: ['userID', 'userName'] },
    Courier,
]

interface SaleItemInput {
    inventoryID: string
    quantity: number
    discountPercent?: number
}

interface TransactionRequestBody {
    clientCode?: string | null
    newClient?: { clientName?: string; clientPhone1?: string; RFC?: string }
    items?: SaleItemInput[]
    paymentMethod?: string
    destAccountClabe?: string | null
    transDiscountID?: string | null
    delivery?: {
        enTienda?: boolean
        address?: string | null
        inmediata?: boolean
        dispatchDateI?: string | null
        dispatchDateF?: string | null
        courierID?: string | null
    }
    shippingCost?: number
    // Solo para pedidos: cuánto se paga de anticipo ahora mismo (0 = nada
    // todavía, el resto queda como outstandingAmount para cobrarse después).
    depositAmount?: number
}

// Comparte la orquestación completa entre "Registrar venta" (paga todo de una
// vez, queda 'completed') y "Registrar pedido" (puede llevar anticipo o nada,
// queda 'pending'): descuenta inventario (por almacén específico), crea la
// transacción + sus renglones, registra el pago si lo hay, y el repartidor si
// se asignó. Todo en una sola transacción de BD: si algo falla no queda nada
// a medias.
async function processTransaction(req: Request, res: Response, transType: 'sale' | 'order') {
    const t = await db.transaction()
    try {
        const {
            clientCode,
            newClient,
            items,
            paymentMethod,
            destAccountClabe,
            transDiscountID,
            delivery,
            shippingCost,
            depositAmount,
        } = req.body as TransactionRequestBody

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error(`El ${transType === 'sale' ? 'venta' : 'pedido'} necesita al menos un producto`)
        }

        // Una venta siempre se paga completa en el momento; un pedido puede
        // llevar solo un anticipo (o ni eso, y quedar todo pendiente).
        const wantsPayment = transType === 'sale' || Number(depositAmount) > 0
        if (wantsPayment) {
            if (paymentMethod !== 'cash' && paymentMethod !== 'digital') {
                throw new Error("La forma de pago debe ser 'cash' o 'digital'")
            }
            if (paymentMethod === 'digital' && !destAccountClabe) {
                throw new Error('Selecciona una cuenta destino para un pago digital')
            }
        }

        // Cliente: uno nuevo (walk-in que se registra al vuelo), uno ya
        // existente (elegido por el buscador), o ninguno (venta/pedido anónimo).
        let resolvedClientCode: string | null = clientCode || null
        if (newClient?.clientName?.trim()) {
            const created = await Client.create({
                clientName: newClient.clientName.trim(),
                clientPhone1: newClient.clientPhone1?.trim() || null,
                RFC: newClient.RFC?.trim() || null,
            }, { transaction: t })
            resolvedClientCode = created.clientCode
        }

        // Descontar inventario primero: si algo no alcanza, se aborta antes de
        // crear nada más. El precio SIEMPRE se toma del producto en el
        // servidor — nunca se confía en lo que mande el cliente.
        let itemsTotal = 0
        const detailRows: Array<{ prodCode: string; quantity: number; unitPrice: number; subtotal: number; appliedDisc: number }> = []
        for (const raw of items) {
            const qty = Number(raw.quantity)
            if (!Number.isInteger(qty) || qty < 1) {
                throw new Error('Cada producto necesita una cantidad válida (entero de 1 o más)')
            }

            // Sin `include` aquí: Postgres no permite FOR UPDATE sobre el lado
            // nulable de un outer join, y Sequelize arma los includes así por
            // default. Se bloquea solo la fila de inventory; producto/almacén
            // se piden aparte (sin lock, ya no hace falta) solo para el mensaje.
            const invRow = await Inventory.findByPk(raw.inventoryID, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            })
            if (!invRow) {
                throw new Error('Uno de los productos ya no está disponible en ese almacén')
            }
            const product = await Product.findByPk(invRow.prodCode, { transaction: t })
            if (qty > invRow.quantity) {
                const warehouse = await Warehouse.findByPk(invRow.whID, { transaction: t })
                throw new Error(`No hay suficiente stock de "${product?.productName}" en ${warehouse?.whname || 'ese almacén'}`)
            }
            await invRow.update({ quantity: invRow.quantity - qty }, { transaction: t })

            const unitPrice = Number(product?.salePrice ?? 0)
            const discFraction = Math.min(Math.max(Number(raw.discountPercent) || 0, 0), 100) / 100
            const lineSubtotal = unitPrice * qty * (1 - discFraction)
            itemsTotal += lineSubtotal

            detailRows.push({
                prodCode: invRow.prodCode,
                quantity: qty,
                unitPrice,
                subtotal: lineSubtotal,
                appliedDisc: discFraction,
            })
        }

        const shipping = Number(shippingCost) || 0
        const finalAmount = itemsTotal + shipping
        const today = new Date().toISOString().slice(0, 10)

        // Venta: se paga completa (outstanding 0). Pedido: solo el anticipo
        // (puede ser 0), el resto queda pendiente de cobrar después.
        const paymentAmount = transType === 'sale' ? finalAmount : Math.min(Math.max(Number(depositAmount) || 0, 0), finalAmount)
        const outstandingAmount = finalAmount - paymentAmount

        const transaction = await Transaction.create({
            transType,
            status: transType === 'sale' ? 'completed' : 'pending',
            clientCode: resolvedClientCode,
            finalAmount,
            outstandingAmount,
            deliveryLocation: delivery?.enTienda ? null : (delivery?.address || null),
            deliveryDate: delivery?.inmediata ? today : null,
            dispatchDateI: delivery?.inmediata ? null : (delivery?.dispatchDateI || null),
            dispatchDateF: delivery?.inmediata ? null : (delivery?.dispatchDateF || null),
        }, { transaction: t })

        for (const row of detailRows) {
            await TransDetail.create({
                ...row,
                transactionID: transaction.transactionID,
                transDiscountID: transDiscountID || null,
            }, { transaction: t })
        }

        // Sin esto no hay nada que registrar en paymentHistory (pedido sin
        // anticipo, por ejemplo) — una fila con paymentAmount 0 no representa
        // ningún pago real.
        if (paymentAmount > 0) {
            await PaymentHistory.create({
                paymentAmount,
                paymentMethod,
                transactionID: transaction.transactionID,
                clabe: paymentMethod === 'digital' ? destAccountClabe : null,
                collectedByUserID: req.user?.userID ?? null,
            }, { transaction: t })

            if (paymentMethod === 'digital' && destAccountClabe) {
                await TransDestAcc.create({ transactionID: transaction.transactionID, clabe: destAccountClabe }, { transaction: t })
            }
        }

        if (delivery?.courierID) {
            await TransCourier.create({ transactionID: transaction.transactionID, courierID: delivery.courierID }, { transaction: t })
        }

        // Vendedor: quien tiene la sesión abierta al registrar (requiere
        // authenticateToken en la ruta — ver transaction.routes.ts).
        if (req.user) {
            await TransUser.create({ transactionID: transaction.transactionID, userID: req.user.userID }, { transaction: t })
        }

        await t.commit()
        await transaction.reload({ include: FULL_TRANSACTION_INCLUDE })
        res.status(201).json(transaction)
    } catch (error: any) {
        await t.rollback()
        res.status(400).json({ message: error.message })
    }
}

// POST /transactions/sale — desde RegisterSale_Page.
export async function createSale(req: Request, res: Response) {
    await processTransaction(req, res, 'sale')
}

// POST /transactions/order — desde RegisterOrder_Page. A diferencia de la
// venta, puede quedar con anticipo parcial (o sin ninguno) y siempre arranca
// en status 'pending'.
export async function createOrder(req: Request, res: Response) {
    await processTransaction(req, res, 'order')
}

export async function createTransaction(req: Request, res: Response) {
    try {
        // OJO: nunca mandes folioYear, folioMonth, folioNumber ni folio en el body.
        // Los genera automáticamente el trigger de PostgreSQL al insertar.
        const { folioYear, folioMonth, folioNumber, folio, ...safeBody } = req.body

        const transaction = await Transaction.create(safeBody)
        await transaction.reload() // trae el folio ya generado por el trigger

        res.status(201).json(transaction)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// GET /transactions?transType=order&status=pending — usado por
// UpdateOrder_Page (pendientes) y OrdersReports_Page (todas, filtra fechas
// en el cliente). Sin filtros, se comporta como antes (todo).
export async function getTransactions(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.transType) where.transType = req.query.transType
        if (req.query.status) where.status = req.query.status
        if (req.query.clientCode) where.clientCode = req.query.clientCode

        // Filtrar por cliente es para ClientHistory_Page, que además necesita
        // ver los productos de cada compra — se agrega TransDetail+Product
        // solo en ese caso para no engordar el listado normal (UpdateOrder_Page
        // / OrdersReports_Page / SalesReport_Page), que no los usa.
        const include = req.query.clientCode
            ? [...LIST_TRANSACTION_INCLUDE, { model: TransDetail, include: [Product] }]
            : LIST_TRANSACTION_INCLUDE

        const transactions = await Transaction.findAll({
            where,
            include,
            order: [['transactionDate', 'DESC']],
        })
        res.json(transactions)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransactionById(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID as string, {
            include: FULL_TRANSACTION_INCLUDE,
        })
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }
        res.json(transaction)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransaction(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID as string)
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }

        // Tampoco dejamos que se sobreescriba el folio en un update
        const { folioYear, folioMonth, folioNumber, folio, ...safeBody } = req.body

        await transaction.update(safeBody)
        await transaction.reload({ include: FULL_TRANSACTION_INCLUDE })
        res.json(transaction)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// POST /transactions/:transactionID/payments — "Abonar importe" en
// OrderDetail_Page: registra un pago parcial más sobre un pedido ya
// existente y descuenta ese importe de outstandingAmount (nunca lo deja negativo).
export async function addPayment(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID as string)
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }

        const { paymentAmount, paymentMethod, destAccountClabe } = req.body as {
            paymentAmount?: number
            paymentMethod?: string
            destAccountClabe?: string | null
        }
        const amount = Number(paymentAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
            res.status(400).json({ message: 'El importe del abono debe ser mayor a 0' })
            return
        }
        if (paymentMethod !== 'cash' && paymentMethod !== 'digital') {
            res.status(400).json({ message: "La forma de pago debe ser 'cash' o 'digital'" })
            return
        }
        if (paymentMethod === 'digital' && !destAccountClabe) {
            res.status(400).json({ message: 'Selecciona una cuenta destino para un pago digital' })
            return
        }
        if (amount > Number(transaction.outstandingAmount)) {
            res.status(400).json({ message: 'El abono no puede ser mayor al importe pendiente' })
            return
        }

        await PaymentHistory.create({
            paymentAmount: amount,
            paymentMethod,
            transactionID: transaction.transactionID,
            clabe: paymentMethod === 'digital' ? destAccountClabe : null,
            collectedByUserID: req.user?.userID ?? null,
        })
        if (paymentMethod === 'digital' && destAccountClabe) {
            await TransDestAcc.findOrCreate({ where: { transactionID: transaction.transactionID, clabe: destAccountClabe } })
        }

        await transaction.update({ outstandingAmount: Number(transaction.outstandingAmount) - amount })
        await transaction.reload({ include: FULL_TRANSACTION_INCLUDE })
        res.json(transaction)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransaction(req: Request, res: Response) {
    try {
        const transaction = await Transaction.findByPk(req.params.transactionID as string)
        if (!transaction) {
            res.status(404).json({ message: 'Transacción no encontrada' })
            return
        }
        await transaction.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
