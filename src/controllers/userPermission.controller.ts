// src/controllers/userPermission.controller.ts
// Permisos por persona individual — a diferencia de permission.controller.ts
// (que edita rolePermission, la plantilla por tipo de cuenta), esto edita los
// permisos reales de un usuario específico. Ver
// contextoMD/migracion_permisos_individuales.sql.
import type { Request, Response } from 'express'
import { Module, UserPermission } from '../models/index.js'

// GET /user-permissions?userID=... — todas las filas, opcionalmente filtradas por usuario.
export async function getUserPermissions(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.userID) {
            where.userID = req.query.userID
        }
        const items = await UserPermission.findAll({
            where,
            include: [Module],
            order: [['userID', 'ASC']],
        })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /user-permissions/:userID/:moduleID — crea la fila si no existía (sin fila = sin
// acceso hasta ahora) y actualiza los booleanos enviados. Solo admin puede llamarlo.
export async function updateUserPermission(req: Request, res: Response) {
    try {
        const { userID, moduleID } = req.params

        const { canView, canCreate, canEdit, canDelete } = req.body
        const updates: Record<string, boolean> = {}
        if (typeof canView === 'boolean') updates.canView = canView
        if (typeof canCreate === 'boolean') updates.canCreate = canCreate
        if (typeof canEdit === 'boolean') updates.canEdit = canEdit
        if (typeof canDelete === 'boolean') updates.canDelete = canDelete

        const [permission] = await UserPermission.findOrCreate({
            where: { userID, moduleID },
            defaults: { userID, moduleID, canView: false, canCreate: false, canEdit: false, canDelete: false },
        })

        await permission.update(updates)
        await permission.reload({ include: [Module] })
        res.json(permission)
    } catch (error: any) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).json({ message: 'userID o moduleID no corresponden a un registro existente' })
            return
        }
        res.status(400).json({ message: error.message })
    }
}
