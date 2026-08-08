// src/controllers/permission.controller.ts
// Endpoints pensados para la pantalla de administración de permisos (sección 2
// de contextoMD/CONTEXTO_PERMISOS_AUTH.md). Para CRUD genérico por permissionID
// ya existe /api/role-permissions; estos dos son la interfaz simplificada por
// (userType, moduleID) que el frontend de administración necesita.
import type { Request, Response } from 'express'
import { Module, RolePermission } from '../models/index.js'

const VALID_USER_TYPES = ['admin', 'seller']

// GET /permissions — matriz completa (todas las reglas ya definidas, con su módulo).
export async function getPermissions(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.userType) {
            where.userType = req.query.userType
        }
        const items = await RolePermission.findAll({
            where,
            include: [Module],
            order: [['userType', 'ASC']],
        })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /permissions/:userType/:moduleID — crea la regla si no existía (sin fila = sin acceso
// hasta ahora) y actualiza los booleanos enviados. Solo admin puede llamarlo.
export async function updatePermission(req: Request, res: Response) {
    try {
        const { userType, moduleID } = req.params

        if (!VALID_USER_TYPES.includes(userType as string)) {
            res.status(400).json({ message: `userType debe ser uno de: ${VALID_USER_TYPES.join(', ')}` })
            return
        }

        const { canView, canCreate, canEdit, canDelete } = req.body
        const updates: Record<string, boolean> = {}
        if (typeof canView === 'boolean') updates.canView = canView
        if (typeof canCreate === 'boolean') updates.canCreate = canCreate
        if (typeof canEdit === 'boolean') updates.canEdit = canEdit
        if (typeof canDelete === 'boolean') updates.canDelete = canDelete

        const [permission] = await RolePermission.findOrCreate({
            where: { userType, moduleID },
            defaults: { userType, moduleID, canView: false, canCreate: false, canEdit: false, canDelete: false },
        })

        await permission.update(updates)
        await permission.reload({ include: [Module] })
        res.json(permission)
    } catch (error: any) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).json({ message: 'moduleID no corresponde a ningún módulo existente' })
            return
        }
        res.status(400).json({ message: error.message })
    }
}
