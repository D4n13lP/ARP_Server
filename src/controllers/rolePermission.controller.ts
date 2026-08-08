// src/controllers/rolePermission.controller.ts
import type { Request, Response } from 'express'
import { RolePermission, Module } from '../models/index.js'

export async function createRolePermission(req: Request, res: Response) {
    try {
        const item = await RolePermission.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getRolePermissions(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.userType) {
            where.userType = req.query.userType
        }
        if (req.query.moduleID) {
            where.moduleID = req.query.moduleID
        }
        const items = await RolePermission.findAll({ where, include: [Module] })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getRolePermissionById(req: Request, res: Response) {
    try {
        const item = await RolePermission.findByPk(req.params.permissionID as string, { include: [Module] })
        if (!item) {
            res.status(404).json({ message: 'RolePermission no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateRolePermission(req: Request, res: Response) {
    try {
        const item = await RolePermission.findByPk(req.params.permissionID as string)
        if (!item) {
            res.status(404).json({ message: 'RolePermission no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteRolePermission(req: Request, res: Response) {
    try {
        const item = await RolePermission.findByPk(req.params.permissionID as string)
        if (!item) {
            res.status(404).json({ message: 'RolePermission no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
