// src/controllers/user.controller.ts
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Op } from 'sequelize'
import { User, UserPermission } from '../models/index.js'
import { generateUniqueEmployeeCode } from '../utils/employeeCode.js'
import { seedUserPermissions } from '../utils/seedUserPermissions.js'
import cloudinary from '../config/cloudinary.js'

const JWT_SECRET = process.env.JWT_SECRET as string

// Nunca regresamos el password (ni el hash) en las respuestas al cliente.
const SIN_PASSWORD = { attributes: { exclude: ['password'] } }

export async function createUser(req: Request, res: Response) {
    try {
        const { userName, email, password, userType, phone } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)
        const employeeCode = await generateUniqueEmployeeCode()
        const user = await User.create({ userName, email, password: hashedPassword, userType, employeeCode, phone: phone || null })
        await seedUserPermissions(user.userID, userType)

        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.status(201).json(safeUser)
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path
            if (field === 'userName') {
                res.status(409).json({ message: 'Ese nombre de usuario ya está en uso' })
                return
            }
            res.status(409).json({ message: 'Ese correo ya está registrado' })
            return
        }
        res.status(400).json({ message: error.message })
    }
}

export async function getUsers(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.isAllowed !== undefined) {
            where.isAllowed = req.query.isAllowed === 'true'
        }
        const users = await User.findAll({ ...SIN_PASSWORD, where })
        res.json(users)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getUserById(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.params.userID as string, SIN_PASSWORD)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }
        res.json(user)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /users/me — el propio usuario autenticado edita su nombre y/o teléfono.
// A propósito NO incluye email/password/userType/isAllowed/employeeCode: cambiar
// el correo principal requeriría re-verificarlo (no implementado), y el resto
// son campos que solo un admin debe poder tocar (vía /promote, /demote, /allow).
export async function updateMe(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.user!.userID)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }

        const { userName, phone } = req.body
        const updates: Record<string, unknown> = {}
        if (typeof userName === 'string' && userName.trim()) updates.userName = userName.trim()
        if (typeof phone === 'string') updates.phone = phone.trim() || null

        await user.update(updates)
        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// PUT /users/me/avatar — sube/reemplaza la foto de perfil del usuario autenticado.
// multipart/form-data, campo "image" (vía multer, ver routes). Mismo mecanismo
// que las fotos de producto (picture.controller.ts), pero 1 a 1 con el usuario
// en vez de guardarse como registros de Picture aparte.
export async function uploadAvatar(req: Request, res: Response) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No se recibió ninguna imagen' })
            return
        }

        const user = await User.findByPk(req.user!.userID)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }

        const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'acabados-rusticos-piramides/avatars' },
                (error, result) => {
                    if (error || !result) {
                        reject(error || new Error('Cloudinary no regresó resultado'))
                        return
                    }
                    resolve(result)
                },
            )
            stream.end(req.file!.buffer)
        })

        // Borra la imagen anterior de Cloudinary para no dejar archivos huérfanos.
        if (user.avatarPublicId) {
            await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => {})
        }

        await user.update({ avatarUrl: result.secure_url, avatarPublicId: result.public_id })
        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateUser(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.params.userID as string)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }

        const updates = { ...req.body }
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10)
        }

        await user.update(updates)
        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteUser(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.params.userID as string)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }
        await user.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// --- Login ---
// El campo del body se sigue llamando "email" por compatibilidad, pero
// LoginDisplay_Page acepta "usuario/correo" — aquí se busca por cualquiera
// de los dos (antes solo comparaba contra email, así que escribir el nombre
// de usuario nunca encontraba la cuenta).
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body
        const identifier = typeof email === 'string' ? email.trim() : email

        const user = await User.findOne({
            where: {
                isActive: true,
                [Op.or]: [{ email: identifier }, { userName: identifier }],
            },
        })
        if (!user) {
            res.status(401).json({ message: 'Credenciales inválidas' })
            return
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            res.status(401).json({ message: 'Credenciales inválidas' })
            return
        }

        if (!user.isEmailVerified) {
            res.status(403).json({ message: 'Debes verificar tu correo antes de iniciar sesión' })
            return
        }

        if (!user.isAllowed) {
            res.status(403).json({ message: 'Tu cuenta está pendiente de aprobación por un administrador' })
            return
        }

        await user.update({ lastLogin: new Date() })

        const token = jwt.sign(
            { userID: user.userID, userType: user.userType },
            JWT_SECRET,
            { expiresIn: '8h' },
        )

        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json({ user: safeUser, token })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /users/:userID/promote — eleva a un usuario existente a 'admin'.
// Protegido con authenticateToken + authorizeRoles('admin') en las rutas.
export async function promoteUser(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.params.userID as string)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }
        await user.update({ userType: 'admin' })
        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// PUT /users/:userID/demote — regresa a un admin a 'seller'. Protegido con
// authenticateToken + authorizeRoles('admin'). Nunca deja al sistema sin
// ningún admin: si el usuario objetivo es el último admin, rechaza la baja
// (ver contextoMD/CONTEXTO_PERMISOS_AUTH.md, sección 5).
export async function demoteUser(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.params.userID as string)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }
        if (user.userType !== 'admin') {
            res.status(400).json({ message: 'Este usuario ya no es admin' })
            return
        }

        const adminCount = await User.count({ where: { userType: 'admin' } })
        if (adminCount <= 1) {
            res.status(409).json({ message: 'No puedes quitar al último admin del sistema' })
            return
        }

        await user.update({ userType: 'seller' })

        // Red de seguridad: si nunca tuvo permisos individuales sembrados (p. ej.
        // el primer admin del sistema, que nunca pasó por 'seller'), le damos un
        // punto de partida ahora — sin esto quedaría sin acceso a nada.
        const existingCount = await UserPermission.count({ where: { userID: user.userID } })
        if (existingCount === 0) {
            await seedUserPermissions(user.userID, 'seller')
        }

        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// PUT /users/:userID/allow — aprueba una cuenta pendiente (isAllowed = true).
// Protegido con authenticateToken + authorizeRoles('admin').
export async function allowUser(req: Request, res: Response) {
    try {
        const user = await User.findByPk(req.params.userID as string)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }
        await user.update({ isAllowed: true })
        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// PUT /users/me/recovery-email — el propio usuario autenticado fija/edita su correo de recuperación.
export async function updateRecoveryEmail(req: Request, res: Response) {
    try {
        const { recoveryEmail } = req.body
        if (typeof recoveryEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
            res.status(400).json({ message: 'recoveryEmail no tiene un formato de correo válido' })
            return
        }

        const user = await User.findByPk(req.user!.userID)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }

        if (recoveryEmail === user.email) {
            res.status(400).json({ message: 'El correo de recuperación debe ser distinto al correo principal' })
            return
        }

        await user.update({ recoveryEmail })
        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json(safeUser)
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json({ message: 'Ese correo de recuperación ya está en uso por otro usuario' })
            return
        }
        res.status(400).json({ message: error.message })
    }
}
