// src/controllers/module.controller.ts
import type { Request, Response } from 'express'
import { Module } from '../models/index.js'

export async function createModule(req: Request, res: Response) {
    try {
        const payload = { ...req.body }
        if (typeof payload.moduleKey === 'string') {
            payload.moduleKey = payload.moduleKey.trim()
        }
        if (typeof payload.moduleName === 'string') {
            payload.moduleName = payload.moduleName.trim()
        }
        const item = await Module.create(payload)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getModules(req: Request, res: Response) {
    try {
        const items = await Module.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getModuleById(req: Request, res: Response) {
    try {
        const item = await Module.findByPk(req.params.moduleID as string)
        if (!item) {
            res.status(404).json({ message: 'Module no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateModule(req: Request, res: Response) {
    try {
        const item = await Module.findByPk(req.params.moduleID as string)
        if (!item) {
            res.status(404).json({ message: 'Module no encontrado' })
            return
        }
        const payload = { ...req.body }
        if (typeof payload.moduleKey === 'string') {
            payload.moduleKey = payload.moduleKey.trim()
        }
        if (typeof payload.moduleName === 'string') {
            payload.moduleName = payload.moduleName.trim()
        }
        await item.update(payload)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteModule(req: Request, res: Response) {
    try {
        const item = await Module.findByPk(req.params.moduleID as string)
        if (!item) {
            res.status(404).json({ message: 'Module no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
