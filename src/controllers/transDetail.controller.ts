// src/controllers/transDetail.controller.ts
import type { Request, Response } from 'express'
import { TransDetail } from '../models/index.js'

export async function createTransDetail(req: Request, res: Response) {
    try {
        const item = await TransDetail.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getTransDetails(req: Request, res: Response) {
    try {
        const items = await TransDetail.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getTransDetailById(req: Request, res: Response) {
    try {
        const item = await TransDetail.findByPk(req.params.transDetailID as string)
        if (!item) {
            res.status(404).json({ message: 'TransDetail no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateTransDetail(req: Request, res: Response) {
    try {
        const item = await TransDetail.findByPk(req.params.transDetailID as string)
        if (!item) {
            res.status(404).json({ message: 'TransDetail no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteTransDetail(req: Request, res: Response) {
    try {
        const item = await TransDetail.findByPk(req.params.transDetailID as string)
        if (!item) {
            res.status(404).json({ message: 'TransDetail no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
