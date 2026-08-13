// src/controllers/dashboard.controller.ts
import type { Request, Response } from 'express'
import { Product, Inventory, Transaction, TransDetail, SalesExpectation, Client, TransUser, User } from '../models/index.js'
import { getSoldQuantityInRange } from '../utils/salesExpectationProgress.js'

interface MetricTableItem {
    id: number
    producto: string
    cantidad: number
    importe?: number
    tiempo?: string
}

function daysSince(date: Date) {
    const diffMs = Date.now() - new Date(date).getTime()
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export async function getDashboard(req: Request, res: Response) {
    try {
        const [ventas, pedidos, products, inventories, saleDetails, expectations, pendingOrders, saleTransUsers] = await Promise.all([
            Transaction.sum('finalAmount', { where: { transType: 'sale' } }),
            Transaction.count({ where: { transType: 'order' } }),
            Product.findAll(),
            Inventory.findAll(),
            TransDetail.findAll({
                include: [
                    { model: Product, attributes: ['productName'] },
                    { model: Transaction, attributes: ['transactionDate'], where: { transType: 'sale' }, required: true },
                ],
            }),
            SalesExpectation.findAll({ include: [Product] }),
            // Pedidos aún no entregados (status queda "pending" hasta que se
            // marquen como entregados) — de ahí sale "Pedidos por vencer".
            Transaction.findAll({
                where: { transType: 'order', status: 'pending' },
                include: [
                    { model: Client, attributes: ['clientName'] },
                    { model: TransDetail, attributes: ['quantity'] },
                ],
            }),
            // Todas las líneas venta-usuario (quién registró cada venta) — de
            // ahí sale "Usuarios con más ventas".
            TransUser.findAll({
                include: [
                    { model: Transaction, attributes: ['finalAmount'], where: { transType: 'sale' }, required: true },
                    { model: User, attributes: ['userName'] },
                ],
            }),
        ])

        // Cantidad total en inventario por producto (sumando todos los almacenes)
        const stockByProduct = new Map<string, number>()
        for (const inv of inventories) {
            const prev = stockByProduct.get(inv.prodCode) || 0
            stockByProduct.set(inv.prodCode, prev + inv.quantity)
        }

        // Productos rezagados: los que NO cumplieron su expectativa de venta
        // dentro del plazo que se les fijó (ver salesExpectation.controller.ts
        // para el mismo criterio de "cumplida" — plazo vencido y vendido <
        // esperado). Si un producto tiene varias expectativas históricas, solo
        // se toma la de plazo más reciente para no repetirlo en la lista.
        const today = new Date().toISOString().slice(0, 10)
        const expectationsWithProgress = await Promise.all(
            expectations.map(async (exp) => ({
                exp,
                soldQuantity: await getSoldQuantityInRange(exp.prodCode, exp.startDate, exp.endDate),
            })),
        )
        const latestMissedPerProduct = new Map<string, (typeof expectationsWithProgress)[number]>()
        for (const item of expectationsWithProgress) {
            if (item.exp.endDate >= today) continue // el plazo todavía no termina
            if (item.soldQuantity >= item.exp.quantity) continue // sí se cumplió
            const prev = latestMissedPerProduct.get(item.exp.prodCode)
            if (!prev || item.exp.endDate > prev.exp.endDate) {
                latestMissedPerProduct.set(item.exp.prodCode, item)
            }
        }
        const rezagados = [...latestMissedPerProduct.values()].sort(
            (a, b) => (b.exp.quantity - b.soldQuantity) - (a.exp.quantity - a.soldQuantity),
        )

        const productosRezagados: MetricTableItem[] = rezagados.slice(0, 5).map((item, idx) => ({
            id: idx + 1,
            producto: item.exp.product?.productName || '',
            // Cuántas unidades le faltaron para llegar a la meta, no el stock —
            // esta tabla ahora mide incumplimiento de la expectativa, no inventario.
            cantidad: Math.max(0, item.exp.quantity - item.soldQuantity),
            tiempo: `venció hace ${daysSince(new Date(item.exp.endDate))} días`,
        }))

        // Productos recién llegados: los últimos productos dados de alta
        const recienLlegados: MetricTableItem[] = [...products]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((p, idx) => ({
                id: idx + 1,
                producto: p.productName,
                cantidad: stockByProduct.get(p.prodCode) || 0,
            }))

        // Productos más vendidos: agregando las líneas de venta por producto
        const salesByProduct = new Map<string, { producto: string; cantidad: number; importe: number }>()
        for (const detail of saleDetails) {
            const key = detail.prodCode
            const entry = salesByProduct.get(key) || { producto: detail.product?.productName || '', cantidad: 0, importe: 0 }
            entry.cantidad += detail.quantity
            entry.importe += Number(detail.subtotal)
            salesByProduct.set(key, entry)
        }
        const masVendidos: MetricTableItem[] = [...salesByProduct.values()]
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5)
            .map((entry, idx) => ({ id: idx + 1, ...entry }))

        // Últimas ventas: las líneas de venta más recientes por fecha de transacción
        const ultimasVentas: MetricTableItem[] = [...saleDetails]
            .sort((a, b) => new Date(b.transaction?.transactionDate || 0).getTime() - new Date(a.transaction?.transactionDate || 0).getTime())
            .slice(0, 5)
            .map((detail, idx) => ({
                id: idx + 1,
                producto: detail.product?.productName || '',
                cantidad: detail.quantity,
                importe: Number(detail.subtotal),
            }))

        // Pedidos por vencer: los que todavía no se entregan (status
        // "pending"), ordenados por fecha de entrega más próxima primero —
        // los ya vencidos (fecha en el pasado) quedan al inicio por ser los
        // más urgentes.
        const todayMs = Date.now()
        const pedidosOrdenados = pendingOrders
            .filter((o) => !!o.deliveryDate)
            .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())

        const pedidosPorVencer: MetricTableItem[] = pedidosOrdenados.slice(0, 5).map((order, idx) => {
            const totalQty = (order.details || []).reduce((sum, d) => sum + d.quantity, 0)
            const diffDays = Math.round((new Date(order.deliveryDate).getTime() - todayMs) / (1000 * 60 * 60 * 24))
            const tiempo = diffDays < 0
                ? `vencido hace ${Math.abs(diffDays)} días`
                : diffDays === 0
                    ? 'vence hoy'
                    : `vence en ${diffDays} días`
            return {
                id: idx + 1,
                producto: `${order.folio || order.transactionID.slice(0, 8)} — ${order.client?.clientName || 'Sin cliente'}`,
                cantidad: totalQty,
                tiempo,
            }
        })

        // Usuarios con más ventas acumuladas: suma de finalAmount de las
        // transacciones "sale" en las que cada usuario aparece en transUser
        // (quien registró la venta, ver processTransaction en transaction.controller.ts).
        const salesByUser = new Map<string, { userName: string; cantidad: number; importe: number }>()
        for (const tu of saleTransUsers) {
            const key = tu.userID
            const entry = salesByUser.get(key) || { userName: tu.user?.userName || '', cantidad: 0, importe: 0 }
            entry.cantidad += 1
            entry.importe += Number(tu.transaction?.finalAmount || 0)
            salesByUser.set(key, entry)
        }
        const usuariosTopVentas: MetricTableItem[] = [...salesByUser.values()]
            .sort((a, b) => b.importe - a.importe)
            .slice(0, 5)
            .map((entry, idx) => ({ id: idx + 1, producto: entry.userName, cantidad: entry.cantidad, importe: entry.importe }))

        res.json({
            stats: {
                ventas: ventas || 0,
                pedidos: pedidos || 0,
                rezagados: latestMissedPerProduct.size,
            },
            masVendidos,
            recienLlegados,
            productosRezagados,
            ultimasVentas,
            pedidosPorVencer,
            usuariosTopVentas,
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
