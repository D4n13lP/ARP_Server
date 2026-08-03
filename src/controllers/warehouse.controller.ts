// src/controllers/warehouse.controller.ts
import type { Request, Response } from 'express'
import { Warehouse } from '../models/index.js'

export async function createWarehouse(req: Request, res: Response) {
    try {
        const item = await Warehouse.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getWarehouses(req: Request, res: Response) {
    try {
        const items = await Warehouse.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getWarehouseById(req: Request, res: Response) {
    try {
        const item = await Warehouse.findByPk(req.params.whID as string)
        if (!item) {
            res.status(404).json({ message: 'Warehouse no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateWarehouse(req: Request, res: Response) {
    try {
        const item = await Warehouse.findByPk(req.params.whID as string)
        if (!item) {
            res.status(404).json({ message: 'Warehouse no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteWarehouse(req: Request, res: Response) {
    try {
        const item = await Warehouse.findByPk(req.params.whID as string)
        if (!item) {
            res.status(404).json({ message: 'Warehouse no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
