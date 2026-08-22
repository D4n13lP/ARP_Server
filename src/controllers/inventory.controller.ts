// src/controllers/inventory.controller.ts
import type { Request, Response } from 'express'
import { QueryTypes } from 'sequelize'
import db from '../config/db.js'
import { Inventory, Product, Warehouse, Category, ProductUnit, Picture, Promo, InventoryAdjustment, TransDetail } from '../models/index.js'

// Cuántas unidades de este producto, en ESTE almacén puntual, están
// comprometidas con pedidos ya registrados pero todavía sin entregar
// (status "pending") — misma noción que "Pendiente entrega" del listado
// general de Inventory.tsx, pero para un producto+almacén en el instante
// del ajuste. Se usa para dejar la foto real de "Pendiente antes" en el
// historial de ajustes (antes quedaba fijo en 0, nunca se calculaba).
async function getPendingDeliveryForProductWarehouse(prodCode: string, whID: string | null | undefined): Promise<number> {
    if (!whID) return 0
    const [row] = await db.query<{ total: string }>(
        `SELECT COALESCE(SUM(td."quantity"), 0) AS total
         FROM "transDetail" td
         JOIN "transaction" t ON t."transactionID" = td."transactionID"
         WHERE td."prodCode" = :prodCode
           AND td."whID" = :whID
           AND t."transType" = 'order'
           AND t."status" = 'pending'`,
        { replacements: { prodCode, whID }, type: QueryTypes.SELECT },
    )
    return Number(row?.total) || 0
}

// El almacén fijo "Pedido especial" (ver warehouse.model.ts) solo puede
// recibir stock a través del flujo de Orden Especial (createSpecialOrderProduct
// en product.controller.ts, que crea el Inventory directo con el modelo, sin
// pasar por este controller) — cualquier otra vía queda bloqueada aquí.
// Se checa por bandera Y por nombre exacto: blindaje extra por si existiera
// una fila con ese nombre creada antes de tener la columna isSpecialOrders
// (o duplicada a mano), que si no quedaría desprotegida.
const SPECIAL_ORDER_WAREHOUSE_NAME = 'Pedido especial'
async function isSpecialOrdersWarehouse(whID: unknown): Promise<boolean> {
    if (typeof whID !== 'string' || !whID) return false
    const wh = await Warehouse.findByPk(whID)
    if (!wh) return false
    return !!wh.isSpecialOrders || wh.whname === SPECIAL_ORDER_WAREHOUSE_NAME
}

export async function createInventory(req: Request, res: Response) {
    try {
        if (await isSpecialOrdersWarehouse(req.body.whID)) {
            res.status(400).json({ message: 'No se puede ingresar productos manualmente al almacén de Pedidos especiales.' })
            return
        }
        const item = await Inventory.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getInventorys(req: Request, res: Response) {
    try {
        const items = await Inventory.findAll({
            // Category/ProductUnit/Picture/Promo: lo que necesita el frontend para
            // mostrar "tiene descuento" y para poder abrir el ProductModal completo
            // desde el botón "Ver" sin pedir el producto aparte.
            include: [{ model: Product, include: [Category, ProductUnit, Picture, Promo] }, Warehouse],
        })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getInventoryById(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateInventory(req: Request, res: Response) {
    const t = await db.transaction()
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string, { transaction: t })
        if (!item) {
            await t.rollback()
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }

        const previousQuantity = item.quantity
        const previousWhID = item.whID
        const changingWarehouse = typeof req.body.whID === 'string' && req.body.whID !== previousWhID

        if (changingWarehouse && await isSpecialOrdersWarehouse(req.body.whID)) {
            await t.rollback()
            res.status(400).json({ message: 'No se puede mover productos manualmente al almacén de Pedidos especiales.' })
            return
        }

        // Si el almacén destino YA tiene una fila de este mismo producto, no
        // debe quedar un segundo inventoryID con el mismo (prodCode, whID) —
        // se suma la cantidad ahí y se borra esta fila, en vez de solo
        // reasignarle el whID (que dejaría dos filas duplicadas). Mismo
        // criterio que transferInventory más abajo.
        if (changingWarehouse) {
            const existingAtDestination = await Inventory.findOne({
                where: { prodCode: item.prodCode, whID: req.body.whID },
                transaction: t,
            })
            if (existingAtDestination) {
                const movedQuantity = typeof req.body.quantity === 'number' ? req.body.quantity : item.quantity
                await existingAtDestination.update({ quantity: existingAtDestination.quantity + movedQuantity }, { transaction: t })
                await item.destroy({ transaction: t })

                await InventoryAdjustment.create({
                    type: 'transfer',
                    prodCode: item.prodCode,
                    sourceWarehousewhID: previousWhID,
                    destinationWarehousewhID: req.body.whID,
                    quantityTransferred: movedQuantity,
                    adjustmentDate: new Date(),
                    description: 'Cambio de almacén (fusionado con inventario ya existente en el destino)',
                }, { transaction: t })

                await t.commit()
                res.json(existingAtDestination)
                return
            }
        }

        await item.update(req.body, { transaction: t })

        // Si la cantidad cambió, deja rastro en el historial de ajustes — así la
        // pestaña "Historial de ajustes" del frontend muestra algo real en vez de
        // quedar siempre vacía. Todo en la misma transacción que item.update():
        // si este INSERT falla (p. ej. por el CHECK de la tabla), la cantidad
        // tampoco debe quedar cambiada a medias sin su rastro en el historial.
        if (typeof req.body.quantity === 'number' && req.body.quantity !== previousQuantity) {
            await InventoryAdjustment.create({
                type: 'adjust',
                prodCode: item.prodCode,
                availableBefore: previousQuantity,
                outstandingDeliveryBefore: await getPendingDeliveryForProductWarehouse(item.prodCode, previousWhID),
                // Almacén donde vivía la fila que se ajustó — whID, NO
                // destinationWarehousewhID (ver comentario en el modelo).
                whID: previousWhID,
                quantityTransferred: item.quantity - previousQuantity,
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
                adjustmentDate: new Date(),
                description: typeof req.body.description === 'string' ? req.body.description : 'Ajuste manual de cantidad',
            }, { transaction: t })
        }

        // Si cambió de almacén, lo mismo pero en "Historial de transferencias".
        if (typeof req.body.whID === 'string' && req.body.whID !== previousWhID) {
            await InventoryAdjustment.create({
                type: 'transfer',
                prodCode: item.prodCode,
                sourceWarehousewhID: previousWhID,
                destinationWarehousewhID: item.whID,
                quantityTransferred: item.quantity,
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
                adjustmentDate: new Date(),
                description: 'Cambio de almacén',
            }, { transaction: t })
        }

        await t.commit()
        res.json(item)
    } catch (error: any) {
        await t.rollback()
        res.status(400).json({ message: error.message })
    }
}

// POST /inventories/transfer — mueve stock de un producto hacia OTRO almacén,
// a diferencia de updateInventory (que reasigna toda la fila). Dos modos:
//   'transfer'  -> resta `quantity` del almacén de origen (no puede exceder lo
//                  disponible ahí) y lo suma en el destino. Queda en
//                  "Historial de transferencias".
//   'ingresar'  -> suma `quantity` directo en el destino, sin tocar ningún
//                  origen (stock nuevo que entra, ej. recién comprado). Sin
//                  límite superior. Queda en "Historial de ajustes".
// sourceWhID puede venir vacío/null cuando el producto todavía no tiene
// ninguna fila de inventario (fila "virtual" en el frontend) — en ese caso
// solo 'ingresar' tiene sentido, ya que no hay nada que transferir.
export async function transferInventory(req: Request, res: Response) {
    const t = await db.transaction()
    try {
        const { prodCode, sourceWhID, destinationWhID, quantity, mode } = req.body

        if (!prodCode || !destinationWhID) {
            await t.rollback()
            res.status(400).json({ message: 'prodCode y destinationWhID son obligatorios' })
            return
        }
        if (mode !== 'transfer' && mode !== 'ingresar') {
            await t.rollback()
            res.status(400).json({ message: "mode debe ser 'transfer' o 'ingresar'" })
            return
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            await t.rollback()
            res.status(400).json({ message: 'quantity debe ser un entero de 1 o más' })
            return
        }
        if (sourceWhID && sourceWhID === destinationWhID) {
            await t.rollback()
            res.status(400).json({ message: 'El almacén de destino debe ser distinto al de origen' })
            return
        }
        // Ni transferir ni ingresar stock nuevo pueden apuntar al almacén de
        // Pedidos especiales — solo el flujo de Orden Especial puede llenarlo.
        if (await isSpecialOrdersWarehouse(destinationWhID)) {
            await t.rollback()
            res.status(400).json({ message: 'No se puede transferir ni ingresar stock manualmente al almacén de Pedidos especiales.' })
            return
        }

        let sourceItem: Inventory | null = null
        if (mode === 'transfer') {
            if (!sourceWhID) {
                await t.rollback()
                res.status(400).json({ message: 'No hay almacén de origen del cual transferir' })
                return
            }
            sourceItem = await Inventory.findOne({ where: { prodCode, whID: sourceWhID }, transaction: t })
            if (!sourceItem || quantity > sourceItem.quantity) {
                await t.rollback()
                res.status(400).json({ message: 'La cantidad excede el stock disponible en el almacén de origen' })
                return
            }
            await sourceItem.update({ quantity: sourceItem.quantity - quantity }, { transaction: t })
        }

        // findOrCreate (no find + create manual): si dos transferencias al mismo
        // (prodCode, whID) llegan casi al mismo tiempo, un find+create separado
        // puede dejar dos inventoryID duplicados (ambos ven "no existe" antes de
        // que el otro inserte). findOrCreate, combinado con el índice único
        // parcial en (prodCode, whID) de la migración, hace esto atómico: si el
        // INSERT choca con el constraint, Sequelize reintenta el SELECT solo.
        const [destItem, destWasCreated] = await Inventory.findOrCreate({
            where: { prodCode, whID: destinationWhID },
            defaults: { quantity: 0 },
            transaction: t,
        })
        const destBefore = destWasCreated ? 0 : destItem.quantity
        await destItem.update({ quantity: destItem.quantity + quantity }, { transaction: t })

        if (mode === 'transfer') {
            await InventoryAdjustment.create({
                type: 'transfer',
                prodCode,
                sourceWarehousewhID: sourceWhID,
                destinationWarehousewhID: destinationWhID,
                quantityTransferred: quantity,
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
                adjustmentDate: new Date(),
                description: 'Transferencia entre almacenes',
            }, { transaction: t })
        } else {
            await InventoryAdjustment.create({
                type: 'adjust',
                prodCode,
                availableBefore: destBefore,
                outstandingDeliveryBefore: await getPendingDeliveryForProductWarehouse(prodCode, destinationWhID),
                // whID, NO destinationWarehousewhID (ver comentario en el modelo:
                // ese campo lo exige NULL el CHECK cuando type='adjust').
                whID: destinationWhID,
                quantityTransferred: quantity,
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
                adjustmentDate: new Date(),
                description: 'Ingreso de stock nuevo',
            }, { transaction: t })
        }

        await t.commit()
        res.json({ source: sourceItem, destination: destItem })
    } catch (error: any) {
        await t.rollback()
        res.status(400).json({ message: error.message })
    }
}

export async function deleteInventory(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string, { include: [Product] })
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        const prodCode = item.prodCode
        const isCustom = item.product?.prodType === 'custom'
        await item.destroy()

        // Los productos armados al vuelo desde "Orden Especial" (prodType
        // 'custom') son de un solo uso: si este era su único registro de
        // inventario Y nunca llegaron a venderse/pedirse de verdad (sin
        // renglones en transDetail, que sí romperían el historial de una
        // transacción real), no tiene sentido dejar el producto huérfano.
        if (isCustom) {
            const [remainingInventory, usedInTransactions] = await Promise.all([
                Inventory.count({ where: { prodCode } }),
                TransDetail.count({ where: { prodCode } }),
            ])
            if (remainingInventory === 0 && usedInTransactions === 0) {
                await Product.destroy({ where: { prodCode } })
            }
        }

        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
