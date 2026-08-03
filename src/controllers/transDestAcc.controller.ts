// src/controllers/transDestAcc.controller.ts
import type { Request, Response } from 'express'
import { TransDestAcc } from '../models/index.js'

export async function createTransDestAcc(req: Request, res: Response) {
    try {
        const item = await TransDestAcc.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTransDestAccs(req: Request, res: Response) {
    try {
        const items = await TransDestAcc.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransDestAccById(req: Request, res: Response) {
    try {
        const item = await TransDestAcc.findOne({ where: { transactionID: req.params.transactionID, clabe: req.params.clabe } })
        if (!item) {
            res.status(404).json({ message: 'TransDestAcc no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransDestAcc(req: Request, res: Response) {
    try {
        const item = await TransDestAcc.findOne({ where: { transactionID: req.params.transactionID, clabe: req.params.clabe } })
        if (!item) {
            res.status(404).json({ message: 'TransDestAcc no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransDestAcc(req: Request, res: Response) {
    try {
        const item = await TransDestAcc.findOne({ where: { transactionID: req.params.transactionID, clabe: req.params.clabe } })
        if (!item) {
            res.status(404).json({ message: 'TransDestAcc no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
