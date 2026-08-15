// src/controllers/clientProductDiscount.controller.ts
import type { Request, Response } from 'express'
import { ClientProductDiscount, Product, Category } from '../models/index.js'

// Producto + su categoría — sin el nested include, Product llegaba sin
// category y "Ver descuentos" (ClientDiscountDetail_Page) no podía mostrar
// esa columna.
const PRODUCT_INCLUDE = { model: Product, include: [Category] }

// POST /client-product-discounts — crea o actualiza el descuento de un
// cliente sobre un producto puntual (upsert por el par clientCode+prodCode,
// ver el índice único en el modelo — así "guardar" desde la pantalla
// siempre deja un solo % vigente por combinación, sin duplicar filas).
export async function createOrUpdateClientProductDiscount(req: Request, res: Response) {
    try {
        const { clientCode, prodCode, discountPercentage } = req.body
        if (!clientCode || !prodCode) {
            res.status(400).json({ message: 'clientCode y prodCode son obligatorios' })
            return
        }
        if (typeof discountPercentage !== 'number' || discountPercentage <= 0 || discountPercentage > 1) {
            res.status(400).json({ message: 'discountPercentage debe ser un número entre 0 y 1' })
            return
        }

        const [item] = await ClientProductDiscount.findOrCreate({
            where: { clientCode, prodCode },
            defaults: { clientCode, prodCode, discountPercentage },
        })
        await item.update({ discountPercentage })
        await item.reload({ include: [PRODUCT_INCLUDE] })
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// GET /client-product-discounts?clientCode=... — los descuentos producto por
// producto de un cliente. Siempre se usa filtrado desde el frontend
// (ClientsDiscountPage, con un cliente ya seleccionado); sin clientCode
// regresa todas (uso administrativo puntual, no lo consume ninguna vista).
export async function getClientProductDiscounts(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.clientCode) where.clientCode = req.query.clientCode
        const items = await ClientProductDiscount.findAll({ where, include: [PRODUCT_INCLUDE] })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function deleteClientProductDiscount(req: Request, res: Response) {
    try {
        const item = await ClientProductDiscount.findByPk(req.params.clientProductDiscountID as string)
        if (!item) {
            res.status(404).json({ message: 'ClientProductDiscount no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
