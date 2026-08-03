// src/controllers/timeUnit.controller.ts
import type { Request, Response } from 'express'
import { TimeUnit } from '../models/index.js'

export async function createTimeUnit(req: Request, res: Response) {
    try {
        const item = await TimeUnit.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTimeUnits(req: Request, res: Response) {
    try {
        const items = await TimeUnit.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTimeUnitById(req: Request, res: Response) {
    try {
        const item = await TimeUnit.findByPk(req.params.timeunitID as string)
        if (!item) {
            res.status(404).json({ message: 'TimeUnit no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTimeUnit(req: Request, res: Response) {
    try {
        const item = await TimeUnit.findByPk(req.params.timeunitID as string)
        if (!item) {
            res.status(404).json({ message: 'TimeUnit no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTimeUnit(req: Request, res: Response) {
    try {
        const item = await TimeUnit.findByPk(req.params.timeunitID as string)
        if (!item) {
            res.status(404).json({ message: 'TimeUnit no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
