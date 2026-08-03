// src/controllers/transCourier.controller.ts
import type { Request, Response } from 'express'
import { TransCourier } from '../models/index.js'

export async function createTransCourier(req: Request, res: Response) {
    try {
        const item = await TransCourier.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTransCouriers(req: Request, res: Response) {
    try {
        const items = await TransCourier.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransCourierById(req: Request, res: Response) {
    try {
        const item = await TransCourier.findOne({ where: { transactionID: req.params.transactionID, courierID: req.params.courierID } })
        if (!item) {
            res.status(404).json({ message: 'TransCourier no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransCourier(req: Request, res: Response) {
    try {
        const item = await TransCourier.findOne({ where: { transactionID: req.params.transactionID, courierID: req.params.courierID } })
        if (!item) {
            res.status(404).json({ message: 'TransCourier no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransCourier(req: Request, res: Response) {
    try {
        const item = await TransCourier.findOne({ where: { transactionID: req.params.transactionID, courierID: req.params.courierID } })
        if (!item) {
            res.status(404).json({ message: 'TransCourier no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
