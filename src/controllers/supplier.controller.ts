// src/controllers/supplier.controller.ts
import type { Request, Response } from 'express'
import { Supplier, Product } from '../models/index.js'

export async function createSupplier(req: Request, res: Response) {
    try {
        const item = await Supplier.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getSuppliers(req: Request, res: Response) {
    try {
        const items = await Supplier.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getSupplierById(req: Request, res: Response) {
    try {
        const item = await Supplier.findByPk(req.params.suppCode as string, {
            include: [Product],
        })
        if (!item) {
            res.status(404).json({ message: 'Supplier no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateSupplier(req: Request, res: Response) {
    try {
        const item = await Supplier.findByPk(req.params.suppCode as string)
        if (!item) {
            res.status(404).json({ message: 'Supplier no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteSupplier(req: Request, res: Response) {
    try {
        const item = await Supplier.findByPk(req.params.suppCode as string)
        if (!item) {
            res.status(404).json({ message: 'Supplier no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
