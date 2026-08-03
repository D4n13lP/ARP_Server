// src/controllers/cash.controller.ts
import type { Request, Response } from 'express'
import { Cash } from '../models/index.js'

export async function createCash(req: Request, res: Response) {
    try {
        const item = await Cash.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getCashs(req: Request, res: Response) {
    try {
        const items = await Cash.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getCashById(req: Request, res: Response) {
    try {
        const item = await Cash.findByPk(req.params.cashID as string)
        if (!item) {
            res.status(404).json({ message: 'Cash no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateCash(req: Request, res: Response) {
    try {
        const item = await Cash.findByPk(req.params.cashID as string)
        if (!item) {
            res.status(404).json({ message: 'Cash no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteCash(req: Request, res: Response) {
    try {
        const item = await Cash.findByPk(req.params.cashID as string)
        if (!item) {
            res.status(404).json({ message: 'Cash no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
