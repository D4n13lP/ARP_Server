// src/controllers/promo.controller.ts
import type { Request, Response } from 'express'
import { Promo } from '../models/index.js'

export async function createPromo(req: Request, res: Response) {
    try {
        const item = await Promo.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getPromos(req: Request, res: Response) {
    try {
        const items = await Promo.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getPromoById(req: Request, res: Response) {
    try {
        const item = await Promo.findByPk(req.params.discountID)
        if (!item) {
            res.status(404).json({ message: 'Promo no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updatePromo(req: Request, res: Response) {
    try {
        const item = await Promo.findByPk(req.params.discountID)
        if (!item) {
            res.status(404).json({ message: 'Promo no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deletePromo(req: Request, res: Response) {
    try {
        const item = await Promo.findByPk(req.params.discountID)
        if (!item) {
            res.status(404).json({ message: 'Promo no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
