// src/controllers/dashboard.controller.ts
import type { Request, Response } from 'express'
import { Op, QueryTypes } from 'sequelize'
import db from '../config/db.js'
import { Product, Inventory, Transaction, TransDetail, SalesExpectation, Client, TransUser, User } from '../models/index.js'
import { getSoldQuantityInRange } from '../utils/salesExpectationProgress.js'
import { toBusinessDateOnly, addDaysToDateOnly, daysBetweenDateOnly } from '../utils/businessTime.js'

interface MetricTableItem {
    id: number
    producto: string
    cantidad: number
    importe?: number
    tiempo?: string
}

// Únicos periodos que ofrece el selector en DashboardPage (7 días / 1 mes) —
// solo el admin lo puede cambiar ahí, pero igual se valida contra esta lista
// por si llega cualquier otro valor en la query.
const ALLOWED_VENTAS_PERIOD_DAYS = [7, 30]

export async function getDashboard(req: Request, res: Response) {
    try {
        // "Hoy" en hora del negocio (México), no UTC — con .toISOString() el
        // servidor (y la sesión de Postgres, en UTC) adelantaban esto hasta 6
        // horas entre las 18:00 y las 23:59 hora local, mostrando "Ingresos
        // del día" en $0 aunque sí hubiera ventas reales (ver src/utils/businessTime.ts).
        // Se calcula UNA sola vez aquí y se reutiliza en todo el resto de la
        // función, para que sea imposible que dos partes del dashboard
        // terminen usando un "hoy" distinto entre sí.
        const todayStr = toBusinessDateOnly()

        // Ventana para USUARIOS CON MÁS VENTAS — desde hace N días hasta hoy,
        // inclusive. ?ventasPeriodDays=7|30, default 7.
        const requestedPeriod = Number(req.query.ventasPeriodDays)
        const ventasPeriodDays = ALLOWED_VENTAS_PERIOD_DAYS.includes(requestedPeriod) ? requestedPeriod : 7
        const periodStartStr = addDaysToDateOnly(todayStr, -ventasPeriodDays)

        // Límites del día de hoy (medianoche a medianoche EN MÉXICO) como
        // instantes UTC reales — paymentDate se guarda como instante real en
        // UTC (new Date() normal, ver comentario en processTransaction), así
        // que hay que comparar con instantes, no con texto de hora local.
        // México está en UTC-6 todo el año actualmente (sin horario de
        // verano desde 2022): medianoche local = 06:00 UTC.
        const todayStartUTC = new Date(`${todayStr}T06:00:00.000Z`)
        const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000)

        const [ventas, pedidos, products, inventories, saleDetails, expectations, pendingOrders, saleTransUsers, abonosOrdenesHoyRows] = await Promise.all([
            // Solo las ventas del día en curso, no el acumulado histórico.
            Transaction.sum('finalAmount', { where: { transType: 'sale', transactionDate: todayStr } }),
            // La tarjeta "Pedidos" cuenta los pendientes de entregar, no el
            // histórico completo — un pedido ya entregado (status "completed")
            // no debería seguir sumando aquí.
            Transaction.count({ where: { transType: 'order', status: 'pending' } }),
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
            // Líneas venta-usuario (quién registró cada venta) de los últimos
            // 7 días — de ahí sale "Usuarios con más ventas".
            TransUser.findAll({
                include: [
                    {
                        model: Transaction,
                        attributes: ['finalAmount'],
                        where: { transType: 'sale', transactionDate: { [Op.gte]: periodStartStr } },
                        required: true,
                    },
                    { model: User, attributes: ['userName'] },
                ],
            }),
            // Abonos (anticipo al registrar el pedido o cobros posteriores,
            // ver processTransaction/registerPayment en transaction.controller.ts)
            // aplicados HOY a pedidos — se suman a "Ventas de hoy" junto con las
            // ventas de contado, ya que ambos son dinero cobrado en el día.
            db.query<{ total: string }>(
                `SELECT COALESCE(SUM(ph."paymentAmount"), 0) AS total
                 FROM "paymentHistory" ph
                 JOIN "transaction" t ON t."transactionID" = ph."transactionID"
                 WHERE t."transType" = 'order'
                   AND ph."paymentDate" >= :todayStart
                   AND ph."paymentDate" < :tomorrowStart`,
                {
                    replacements: { todayStart: todayStartUTC.toISOString(), tomorrowStart: tomorrowStartUTC.toISOString() },
                    type: QueryTypes.SELECT,
                },
            ),
        ])
        const abonosOrdenesHoy = Number(abonosOrdenesHoyRows[0]?.total) || 0

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
        const expectationsWithProgress = await Promise.all(
            expectations.map(async (exp) => ({
                exp,
                soldQuantity: await getSoldQuantityInRange(exp.prodCode, exp.startDate, exp.endDate),
            })),
        )
        const latestMissedPerProduct = new Map<string, (typeof expectationsWithProgress)[number]>()
        for (const item of expectationsWithProgress) {
            if (item.exp.endDate >= todayStr) continue // el plazo todavía no termina
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
            tiempo: `venció hace ${daysBetweenDateOnly(item.exp.endDate, todayStr).toLocaleString('es-MX')} días`,
        }))

        // Productos con stock bajo: cantidad disponible en inventario
        // (sumando todos los almacenes) igual o menor a su umbral "lowStock"
        // configurado en el producto — mientras "Productos Rezagados" mide
        // ventas contra la expectativa, esta mide inventario contra su mínimo.
        const stockBajo = products
            .filter((p) => p.lowStock > 0 && (stockByProduct.get(p.prodCode) || 0) <= p.lowStock)
            .sort((a, b) => (stockByProduct.get(a.prodCode) || 0) - (stockByProduct.get(b.prodCode) || 0))

        const productosStockBajo: MetricTableItem[] = stockBajo.slice(0, 5).map((p, idx) => ({
            id: idx + 1,
            producto: p.productName,
            cantidad: stockByProduct.get(p.prodCode) || 0,
            tiempo: `mínimo: ${p.lowStock.toLocaleString('es-MX')}`,
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
        // "pending") y están por vencer o ya vencidos. La fecha límite de
        // cada pedido es deliveryDate (entrega inmediata) o, si no tiene,
        // dispatchDateF (fin de la ventana de despacho) — solo entran los que
        // les queda 1 día o menos para esa fecha, o ya la pasaron ("vence
        // hoy" se cuenta como urgente también, no solo mañana/vencido). Los
        // ya vencidos quedan al inicio por ser los más urgentes. Todas son
        // columnas DATEONLY ("YYYY-MM-DD"): se comparan como texto/aritmética
        // de calendario, nunca convirtiéndolas a un instante real
        // (new Date(...).getTime()), que las interpreta como medianoche UTC y
        // se corre de día contra la hora de México.
        const pedidosOrdenados = pendingOrders
            .map((order) => ({ order, fechaLimite: order.deliveryDate || order.dispatchDateF }))
            .filter((x): x is { order: (typeof pendingOrders)[number]; fechaLimite: string } => (
                !!x.fechaLimite && daysBetweenDateOnly(todayStr, x.fechaLimite) <= 1
            ))
            .sort((a, b) => (a.fechaLimite < b.fechaLimite ? -1 : a.fechaLimite > b.fechaLimite ? 1 : 0))

        const pedidosPorVencer: MetricTableItem[] = pedidosOrdenados.slice(0, 5).map(({ order, fechaLimite }, idx) => {
            const totalQty = (order.details || []).reduce((sum, d) => sum + d.quantity, 0)
            const diffDays = daysBetweenDateOnly(todayStr, fechaLimite)
            const tiempo = diffDays < 0
                ? `vencido hace ${Math.abs(diffDays).toLocaleString('es-MX')} días`
                : diffDays === 0
                    ? 'vence hoy'
                    : `vence en ${diffDays.toLocaleString('es-MX')} días`
            return {
                id: idx + 1,
                producto: `${order.folio || order.transactionID.slice(0, 8)} — ${order.client?.clientName || 'Sin cliente'}`,
                cantidad: totalQty,
                tiempo,
            }
        })

        // Usuarios con más ventas acumuladas en el periodo elegido: suma de
        // finalAmount de las transacciones "sale" en las que cada usuario
        // aparece en transUser (quien registró la venta, ver
        // processTransaction en transaction.controller.ts) — saleTransUsers
        // ya viene filtrado a esa ventana de fechas.
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
                // Ventas de contado del día + abonos cobrados hoy a pedidos
                // (anticipo al registrarlos o cobros posteriores) — ambos son
                // dinero que efectivamente entró hoy, aunque el pedido en sí
                // se haya registrado otro día.
                ventas: (ventas || 0) + abonosOrdenesHoy,
                pedidos: pedidos || 0,
                rezagados: latestMissedPerProduct.size,
            },
            masVendidos,
            recienLlegados,
            productosRezagados,
            ultimasVentas,
            pedidosPorVencer,
            usuariosTopVentas,
            productosStockBajo,
            // Regresa el periodo realmente aplicado (ya validado contra
            // ALLOWED_VENTAS_PERIOD_DAYS) para que el frontend sepa qué
            // opción del selector corresponde a los datos que llegaron.
            ventasPeriodDays,
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
