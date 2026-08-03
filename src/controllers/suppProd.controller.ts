// src/controllers/suppProd.controller.ts
import type { Request, Response } from 'express'
import { SuppProd } from '../models/index.js'

export async function createSuppProd(req: Request, res: Response) {
    try {
        const item = await SuppProd.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getSuppProds(req: Request, res: Response) {
    try {
        const items = await SuppProd.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getSuppProdById(req: Request, res: Response) {
    try {
        const item = await SuppProd.findOne({ where: { suppCode: req.params.suppCode, prodCode: req.params.prodCode } })
        if (!item) {
            res.status(404).json({ message: 'SuppProd no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateSuppProd(req: Request, res: Response) {
    try {
        const item = await SuppProd.findOne({ where: { suppCode: req.params.suppCode, prodCode: req.params.prodCode } })
        if (!item) {
            res.status(404).json({ message: 'SuppProd no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteSuppProd(req: Request, res: Response) {
    try {
        const item = await SuppProd.findOne({ where: { suppCode: req.params.suppCode, prodCode: req.params.prodCode } })
        if (!item) {
            res.status(404).json({ message: 'SuppProd no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
