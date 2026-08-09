// src/controllers/inventory.controller.ts
import type { Request, Response } from 'express'
import { Inventory, Product, Warehouse, Category, ProductUnit, Picture, Promo, InventoryAdjustment } from '../models/index.js'

export async function createInventory(req: Request, res: Response) {
    try {
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
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }

        const previousQuantity = item.quantity
        await item.update(req.body)

        // Si la cantidad cambió, deja rastro en el historial de ajustes — así la
        // pestaña "Historial de ajustes" del frontend muestra algo real en vez de
        // quedar siempre vacía.
        if (typeof req.body.quantity === 'number' && req.body.quantity !== previousQuantity) {
            await InventoryAdjustment.create({
                type: 'adjust',
                prodCode: item.prodCode,
                availableBefore: previousQuantity,
                outstandingDeliveryBefore: 0,
                quantityTransferred: item.quantity - previousQuantity,
                adjustmentDate: new Date(),
                description: typeof req.body.description === 'string' ? req.body.description : 'Ajuste manual de cantidad',
            })
        }

        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteInventory(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
