// src/controllers/client.controller.ts
import type { Request, Response } from 'express'
import { Client } from '../models/index.js'

export async function createClient(req: Request, res: Response) {
    try {
        const item = await Client.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getClients(req: Request, res: Response) {
    try {
        const items = await Client.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getClientById(req: Request, res: Response) {
    try {
        const item = await Client.findByPk(req.params.clientCode as string)
        if (!item) {
            res.status(404).json({ message: 'Client no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateClient(req: Request, res: Response) {
    try {
        const item = await Client.findByPk(req.params.clientCode as string)
        if (!item) {
            res.status(404).json({ message: 'Client no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteClient(req: Request, res: Response) {
    try {
        const item = await Client.findByPk(req.params.clientCode as string)
        if (!item) {
            res.status(404).json({ message: 'Client no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
