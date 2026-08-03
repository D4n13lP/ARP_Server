// src/controllers/salesExpectation.controller.ts
import type { Request, Response } from 'express'
import { SalesExpectation } from '../models/index.js'

export async function createSalesExpectation(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getSalesExpectations(req: Request, res: Response) {
    try {
        const items = await SalesExpectation.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getSalesExpectationById(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.findByPk(req.params.expectationID as string)
        if (!item) {
            res.status(404).json({ message: 'SalesExpectation no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateSalesExpectation(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.findByPk(req.params.expectationID as string)
        if (!item) {
            res.status(404).json({ message: 'SalesExpectation no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteSalesExpectation(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.findByPk(req.params.expectationID as string)
        if (!item) {
            res.status(404).json({ message: 'SalesExpectation no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
