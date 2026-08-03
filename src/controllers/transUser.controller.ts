// src/controllers/transUser.controller.ts
import type { Request, Response } from 'express'
import { TransUser } from '../models/index.js'

export async function createTransUser(req: Request, res: Response) {
    try {
        const item = await TransUser.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTransUsers(req: Request, res: Response) {
    try {
        const items = await TransUser.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransUserById(req: Request, res: Response) {
    try {
        const item = await TransUser.findOne({ where: { transactionID: req.params.transactionID, userID: req.params.userID } })
        if (!item) {
            res.status(404).json({ message: 'TransUser no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransUser(req: Request, res: Response) {
    try {
        const item = await TransUser.findOne({ where: { transactionID: req.params.transactionID, userID: req.params.userID } })
        if (!item) {
            res.status(404).json({ message: 'TransUser no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransUser(req: Request, res: Response) {
    try {
        const item = await TransUser.findOne({ where: { transactionID: req.params.transactionID, userID: req.params.userID } })
        if (!item) {
            res.status(404).json({ message: 'TransUser no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
