// src/controllers/destAccount.controller.ts
import type { Request, Response } from 'express'
import { DestAccount } from '../models/index.js'

export async function createDestAccount(req: Request, res: Response) {
    try {
        const item = await DestAccount.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getDestAccounts(req: Request, res: Response) {
    try {
        const items = await DestAccount.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getDestAccountById(req: Request, res: Response) {
    try {
        const item = await DestAccount.findByPk(req.params.clabe)
        if (!item) {
            res.status(404).json({ message: 'DestAccount no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateDestAccount(req: Request, res: Response) {
    try {
        const item = await DestAccount.findByPk(req.params.clabe)
        if (!item) {
            res.status(404).json({ message: 'DestAccount no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteDestAccount(req: Request, res: Response) {
    try {
        const item = await DestAccount.findByPk(req.params.clabe)
        if (!item) {
            res.status(404).json({ message: 'DestAccount no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
