// src/controllers/category.controller.ts
import type { Request, Response } from 'express'
import { Category } from '../models/index.js'

export async function createCategory(req: Request, res: Response) {
    try {
        const payload = { ...req.body }
        if (typeof payload.categoryName === 'string') {
            payload.categoryName = payload.categoryName.trim()
        }
        const item = await Category.create(payload)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getCategorys(req: Request, res: Response) {
    try {
        const items = await Category.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getCategoryById(req: Request, res: Response) {
    try {
        const item = await Category.findByPk(req.params.categoryID)
        if (!item) {
            res.status(404).json({ message: 'Category no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateCategory(req: Request, res: Response) {
    try {
        const item = await Category.findByPk(req.params.categoryID)
        if (!item) {
            res.status(404).json({ message: 'Category no encontrado' })
            return
        }
        const payload = { ...req.body }
        if (typeof payload.categoryName === 'string') {
            payload.categoryName = payload.categoryName.trim()
        }
        await item.update(payload)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteCategory(req: Request, res: Response) {
    try {
        const item = await Category.findByPk(req.params.categoryID)
        if (!item) {
            res.status(404).json({ message: 'Category no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
