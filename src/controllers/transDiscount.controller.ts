// src/controllers/transDiscount.controller.ts
import type { Request, Response } from 'express'
import { TransDiscount } from '../models/index.js'

export async function createTransDiscount(req: Request, res: Response) {
    try {
        const item = await TransDiscount.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTransDiscounts(req: Request, res: Response) {
    try {
        const items = await TransDiscount.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransDiscountById(req: Request, res: Response) {
    try {
        const item = await TransDiscount.findByPk(req.params.transDiscountID as string)
        if (!item) {
            res.status(404).json({ message: 'TransDiscount no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransDiscount(req: Request, res: Response) {
    try {
        const item = await TransDiscount.findByPk(req.params.transDiscountID as string)
        if (!item) {
            res.status(404).json({ message: 'TransDiscount no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransDiscount(req: Request, res: Response) {
    try {
        const item = await TransDiscount.findByPk(req.params.transDiscountID as string)
        if (!item) {
            res.status(404).json({ message: 'TransDiscount no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
