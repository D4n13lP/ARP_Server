// src/controllers/productUnit.controller.ts
import type { Request, Response } from 'express'
import { ProductUnit } from '../models/index.js'

export async function createProductUnit(req: Request, res: Response) {
    try {
        const item = await ProductUnit.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getProductUnits(req: Request, res: Response) {
    try {
        const items = await ProductUnit.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getProductUnitById(req: Request, res: Response) {
    try {
        const item = await ProductUnit.findByPk(req.params.produnitID as string)
        if (!item) {
            res.status(404).json({ message: 'ProductUnit no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateProductUnit(req: Request, res: Response) {
    try {
        const item = await ProductUnit.findByPk(req.params.produnitID as string)
        if (!item) {
            res.status(404).json({ message: 'ProductUnit no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteProductUnit(req: Request, res: Response) {
    try {
        const item = await ProductUnit.findByPk(req.params.produnitID as string)
        if (!item) {
            res.status(404).json({ message: 'ProductUnit no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
