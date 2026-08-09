// src/middleware/auth.ts
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Module, UserPermission } from '../models/index.js'

const JWT_SECRET = process.env.JWT_SECRET as string

export interface JwtPayload {
    userID: string
    userType: string
}

// Verifica el JWT del header Authorization: Bearer <token> y adjunta { userID, userType } a req.user.
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

    if (!token) {
        res.status(401).json({ message: 'Token no proporcionado' })
        return
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
        req.user = { userID: payload.userID, userType: payload.userType }
        next()
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' })
    }
}

// Requiere que req.user.userType esté entre los roles permitidos. Usar después de authenticateToken.
export function authorizeRoles(...roles: string[]) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (!req.user) {
            res.status(401).json({ message: 'No autenticado' })
            return
        }
        if (!roles.includes(req.user.userType)) {
            res.status(403).json({ message: 'No tienes permiso para realizar esta acción' })
            return
        }
        next()
    }
}

type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

const ACTION_COLUMN: Record<PermissionAction, 'canView' | 'canCreate' | 'canEdit' | 'canDelete'> = {
    view: 'canView',
    create: 'canCreate',
    edit: 'canEdit',
    delete: 'canDelete',
}

// Consulta userPermission para la persona de la sesión (no su rol) + el moduleKey
// dado, y exige que la columna correspondiente a `action` sea true. Los permisos
// son por individuo (ver contextoMD/migracion_permisos_individuales.sql) — dos
// usuarios del mismo userType pueden tener accesos distintos. Usar después de authenticateToken.
export function checkPermission(moduleKey: string, action: PermissionAction) {
    const column = ACTION_COLUMN[action]

    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'No autenticado' })
                return
            }

            // El admin siempre tiene acceso total, incluso si un módulo nuevo aún
            // no tiene fila individual sembrada (evita que un módulo recién creado
            // deje al admin fuera hasta que alguien lo seedee a mano).
            if (req.user.userType === 'admin') {
                next()
                return
            }

            const permission = await UserPermission.findOne({
                where: { userID: req.user.userID },
                include: [{ model: Module, where: { moduleKey }, attributes: [] }],
            })

            if (!permission || !permission.get(column)) {
                res.status(403).json({ message: 'No tienes permiso para realizar esta acción' })
                return
            }

            next()
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
}
