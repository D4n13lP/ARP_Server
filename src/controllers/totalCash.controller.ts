// src/controllers/totalCash.controller.ts
import type { Request, Response } from 'express'
import { TotalCash } from '../models/index.js'

export async function createTotalCash(req: Request, res: Response) {
    try {
        const item = await TotalCash.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTotalCashs(req: Request, res: Response) {
    try {
        const items = await TotalCash.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTotalCashById(req: Request, res: Response) {
    try {
        const item = await TotalCash.findByPk(req.params.totalCashID as string)
        if (!item) {
            res.status(404).json({ message: 'TotalCash no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTotalCash(req: Request, res: Response) {
    try {
        const item = await TotalCash.findByPk(req.params.totalCashID as string)
        if (!item) {
            res.status(404).json({ message: 'TotalCash no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTotalCash(req: Request, res: Response) {
    try {
        const item = await TotalCash.findByPk(req.params.totalCashID as string)
        if (!item) {
            res.status(404).json({ message: 'TotalCash no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
