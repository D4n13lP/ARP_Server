// src/controllers/inventoryAdjustment.controller.ts
import type { Request, Response } from 'express'
import { InventoryAdjustment } from '../models/index.js'

export async function createInventoryAdjustment(req: Request, res: Response) {
    try {
        const item = await InventoryAdjustment.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getInventoryAdjustments(req: Request, res: Response) {
    try {
        const items = await InventoryAdjustment.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getInventoryAdjustmentById(req: Request, res: Response) {
    try {
        const item = await InventoryAdjustment.findByPk(req.params.adjustID)
        if (!item) {
            res.status(404).json({ message: 'InventoryAdjustment no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateInventoryAdjustment(req: Request, res: Response) {
    try {
        const item = await InventoryAdjustment.findByPk(req.params.adjustID)
        if (!item) {
            res.status(404).json({ message: 'InventoryAdjustment no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteInventoryAdjustment(req: Request, res: Response) {
    try {
        const item = await InventoryAdjustment.findByPk(req.params.adjustID)
        if (!item) {
            res.status(404).json({ message: 'InventoryAdjustment no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
