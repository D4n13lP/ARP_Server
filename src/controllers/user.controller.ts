// src/controllers/user.controller.ts
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import { generateUniqueEmployeeCode } from '../utils/employeeCode.js'

const JWT_SECRET = process.env.JWT_SECRET as string

// Nunca regresamos el password (ni el hash) en las respuestas al cliente.
const SIN_PASSWORD = { attributes: { exclude: ['password'] } }

export async function createUser(req: Request, res: Response) {
    try {
        const { userName, email, password, userType, phone } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)
        const employeeCode = await generateUniqueEmployeeCode()
        const user = await User.create({ userName, email, password: hashedPassword, userType, employeeCode, phone: phone || null })

        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.status(201).json(safeUser)
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(409).json({ message: 'Ese correo ya está registrado' })
            return
        }
        res.status(400).json({ message: error.message })
    }
}

export async function getUsers(req: Request, res: Response) {
    try {
        const users = await User.findAll(SIN_PASSWORD)
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
export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ where: { email, isActive: true } })
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
