// src/controllers/user.controller.ts
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { User } from '../models/index.js'

// Nunca regresamos el password (ni el hash) en las respuestas al cliente.
const SIN_PASSWORD = { attributes: { exclude: ['password'] } }

export async function createUser(req: Request, res: Response) {
    try {
        const { userName, email, password, userType } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ userName, email, password: hashedPassword, userType })

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
        const user = await User.findByPk(req.params.userID, SIN_PASSWORD)
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
        const user = await User.findByPk(req.params.userID)
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
        const user = await User.findByPk(req.params.userID)
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

        await user.update({ lastLogin: new Date() })

        const { password: _omit, ...safeUser } = user.toJSON() as any
        res.json({ user: safeUser })
        // Nota: aquí es donde agregarías la firma del JWT (jsonwebtoken)
        // cuando quieras implementar el token de sesión.
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
