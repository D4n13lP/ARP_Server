// src/controllers/dashboard.controller.ts
import type { Request, Response } from 'express'
import { Product, Inventory, Transaction, TransDetail } from '../models/index.js'

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
        const [ventas, pedidos, products, inventories, saleDetails] = await Promise.all([
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
        ])

        // Cantidad total en inventario por producto (sumando todos los almacenes)
        const stockByProduct = new Map<string, number>()
        for (const inv of inventories) {
            const prev = stockByProduct.get(inv.prodCode) || 0
            stockByProduct.set(inv.prodCode, prev + inv.quantity)
        }

        // Productos rezagados: con stock disponible por debajo (o igual) de su umbral de stock bajo
        const rezagados = products
            .filter((p) => p.lowStock > 0 && (stockByProduct.get(p.prodCode) || 0) <= p.lowStock)
            .sort((a, b) => (stockByProduct.get(a.prodCode) || 0) - (stockByProduct.get(b.prodCode) || 0))

        const productosRezagados: MetricTableItem[] = rezagados.slice(0, 5).map((p, idx) => ({
            id: idx + 1,
            producto: p.productName,
            cantidad: stockByProduct.get(p.prodCode) || 0,
            tiempo: `${daysSince(p.createdAt)} días`,
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

        res.json({
            stats: {
                ventas: ventas || 0,
                pedidos: pedidos || 0,
                rezagados: rezagados.length,
            },
            masVendidos,
            recienLlegados,
            productosRezagados,
            ultimasVentas,
        })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
