// src/controllers/paymentHistory.controller.ts
import type { Request, Response } from 'express'
import { PaymentHistory } from '../models/index.js'

export async function createPaymentHistory(req: Request, res: Response) {
    try {
        const item = await PaymentHistory.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getPaymentHistorys(req: Request, res: Response) {
    try {
        const items = await PaymentHistory.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getPaymentHistoryById(req: Request, res: Response) {
    try {
        const item = await PaymentHistory.findByPk(req.params.pymntHistryID as string)
        if (!item) {
            res.status(404).json({ message: 'PaymentHistory no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updatePaymentHistory(req: Request, res: Response) {
    try {
        const item = await PaymentHistory.findByPk(req.params.pymntHistryID as string)
        if (!item) {
            res.status(404).json({ message: 'PaymentHistory no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deletePaymentHistory(req: Request, res: Response) {
    try {
        const item = await PaymentHistory.findByPk(req.params.pymntHistryID as string)
        if (!item) {
            res.status(404).json({ message: 'PaymentHistory no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
