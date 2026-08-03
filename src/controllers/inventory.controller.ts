// src/controllers/inventory.controller.ts
import type { Request, Response } from 'express'
import { Inventory, Product, Warehouse, Category } from '../models/index.js'

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
            include: [{ model: Product, include: [Category] }, Warehouse],
        })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getInventoryById(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID)
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
        const item = await Inventory.findByPk(req.params.inventoryID)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteInventory(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID)
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
