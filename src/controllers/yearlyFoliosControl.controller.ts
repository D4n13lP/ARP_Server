// src/controllers/yearlyFoliosControl.controller.ts
import type { Request, Response } from 'express'
import { YearlyFoliosControl } from '../models/index.js'

export async function createYearlyFoliosControl(req: Request, res: Response) {
    try {
        const item = await YearlyFoliosControl.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getYearlyFoliosControls(req: Request, res: Response) {
    try {
        const items = await YearlyFoliosControl.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getYearlyFoliosControlById(req: Request, res: Response) {
    try {
        const item = await YearlyFoliosControl.findByPk(req.params.year)
        if (!item) {
            res.status(404).json({ message: 'YearlyFoliosControl no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateYearlyFoliosControl(req: Request, res: Response) {
    try {
        const item = await YearlyFoliosControl.findByPk(req.params.year)
        if (!item) {
            res.status(404).json({ message: 'YearlyFoliosControl no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteYearlyFoliosControl(req: Request, res: Response) {
    try {
        const item = await YearlyFoliosControl.findByPk(req.params.year)
        if (!item) {
            res.status(404).json({ message: 'YearlyFoliosControl no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
