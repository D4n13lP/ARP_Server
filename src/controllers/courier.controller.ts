// src/controllers/courier.controller.ts
import type { Request, Response } from 'express'
import { Courier } from '../models/index.js'

export async function createCourier(req: Request, res: Response) {
    try {
        const item = await Courier.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getCouriers(req: Request, res: Response) {
    try {
        const items = await Courier.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getCourierById(req: Request, res: Response) {
    try {
        const item = await Courier.findByPk(req.params.courierID as string)
        if (!item) {
            res.status(404).json({ message: 'Courier no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateCourier(req: Request, res: Response) {
    try {
        const item = await Courier.findByPk(req.params.courierID as string)
        if (!item) {
            res.status(404).json({ message: 'Courier no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteCourier(req: Request, res: Response) {
    try {
        const item = await Courier.findByPk(req.params.courierID as string)
        if (!item) {
            res.status(404).json({ message: 'Courier no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
