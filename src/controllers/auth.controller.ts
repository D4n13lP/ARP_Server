// src/controllers/auth.controller.ts
import type { Request, Response } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { Op } from 'sequelize'
import db from '../config/db.js'
import { User, EmailVerificationToken, PasswordResetToken } from '../models/index.js'
import { sendVerificationEmail, sendResetEmail, sendWelcomeEmail } from '../utils/mailer.js'
import { generateUniqueEmployeeCode } from '../utils/employeeCode.js'
import { seedUserPermissions } from '../utils/seedUserPermissions.js'

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1h

function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex')
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /auth/register — registro público. userType NUNCA se toma del body: el
// primer usuario del sistema se crea como 'admin', todos los demás como 'seller'.
export async function register(req: Request, res: Response) {
    try {
        const { userName, email, password, phone, recoveryEmail } = req.body
        if (!userName || !email || !password) {
            res.status(400).json({ message: 'userName, email y password son obligatorios' })
            return
        }

        if (recoveryEmail) {
            if (!EMAIL_FORMAT.test(recoveryEmail)) {
                res.status(400).json({ message: 'recoveryEmail no tiene un formato de correo válido' })
                return
            }
            if (recoveryEmail === email) {
                res.status(400).json({ message: 'El correo de recuperación debe ser distinto al correo principal' })
                return
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const token = crypto.randomBytes(32).toString('hex')
        const tokenHash = hashToken(token)
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS)

        const user = await db.transaction(async (t) => {
            // Serializa registros concurrentes con la tabla vacía: sin este lock,
            // dos registros simultáneos podrían contar 0 usuarios cada uno y
            // ambos terminar como admin.
            await db.query('SELECT pg_advisory_xact_lock(42)', { transaction: t })

            const existingUsers = await User.count({ transaction: t })
            const isFirstUser = existingUsers === 0
            const userType = isFirstUser ? 'admin' : 'seller'
            const employeeCode = await generateUniqueEmployeeCode(t)

            const created = await User.create(
                {
                    userName,
                    email,
                    password: hashedPassword,
                    userType,
                    employeeCode,
                    phone: phone || null,
                    recoveryEmail: recoveryEmail || null,
                    // El primer usuario (admin) no necesita aprobación de nadie —
                    // no habría quién lo apruebe. Todos los demás quedan pendientes
                    // (isAllowed=false por default) hasta que un admin los acepte.
                    isAllowed: isFirstUser,
                },
                { transaction: t },
            )

            // Copia la plantilla de permisos de su rol como punto de partida
            // individual y editable (ver contextoMD/migracion_permisos_individuales.sql).
            await seedUserPermissions(created.userID, userType, t)

            await EmailVerificationToken.create(
                { userID: created.userID, tokenHash, expiresAt },
                { transaction: t },
            )

            return created
        })

        try {
            await sendVerificationEmail(email, token)
        } catch (mailError: any) {
            // El usuario ya se creó en la BD; avisamos del problema de envío en vez de revertir el registro.
            res.status(201).json({
                message: 'Cuenta creada, pero hubo un problema al enviar el correo de verificación. Contacta al administrador.',
                userID: user.userID,
                employeeCode: user.employeeCode,
            })
            return
        }

        res.status(201).json({
            message: 'Cuenta creada. Revisa tu correo para verificarla.',
            userID: user.userID,
            employeeCode: user.employeeCode,
        })
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors?.[0]?.path
            if (field === 'recoveryEmail') {
                res.status(409).json({ message: 'Ese correo de recuperación ya está en uso por otro usuario' })
                return
            }
            res.status(409).json({ message: 'Ese correo ya está registrado' })
            return
        }
        res.status(400).json({ message: error.message })
    }
}

// GET /auth/verify-email?token=... — hashea el token recibido y lo compara contra el hash guardado.
export async function verifyEmail(req: Request, res: Response) {
    try {
        const token = req.query.token as string | undefined
        if (!token) {
            res.status(400).json({ message: 'Token no proporcionado' })
            return
        }

        const tokenHash = hashToken(token)
        const record = await EmailVerificationToken.findOne({
            where: { tokenHash, expiresAt: { [Op.gt]: new Date() } },
        })

        if (!record) {
            res.status(400).json({ message: 'El enlace de verificación es inválido o expiró' })
            return
        }

        const user = await User.findByPk(record.userID)
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' })
            return
        }

        await user.update({ isEmailVerified: true })
        await EmailVerificationToken.destroy({ where: { userID: record.userID } })

        try {
            await sendWelcomeEmail(user.email, user.userName, user.employeeCode)
        } catch (mailError) {
            // La cuenta ya quedó verificada; que falle el correo de bienvenida no debe bloquear la respuesta.
        }

        res.json({ message: 'Correo verificado correctamente. Ya puedes iniciar sesión.' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// POST /auth/forgot-password — acepta email principal o de recuperación. Responde
// el mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados.
export async function forgotPassword(req: Request, res: Response) {
    const genericResponse = { message: 'Si el correo está registrado, se envió un enlace de recuperación.' }
    try {
        const { email } = req.body
        if (!email) {
            res.status(400).json({ message: 'email es obligatorio' })
            return
        }

        const user = await User.findOne({ where: { [Op.or]: [{ email }, { recoveryEmail: email }] } })

        if (user) {
            const token = crypto.randomBytes(32).toString('hex')
            const tokenHash = hashToken(token)
            const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

            await PasswordResetToken.create({ userID: user.userID, tokenHash, expiresAt })

            try {
                // Se envía a la dirección que el usuario escribió en el formulario
                // (la que sí tiene acceso ahora mismo), no necesariamente a user.email.
                await sendResetEmail(email, token)
            } catch (mailError) {
                // No delatamos el fallo de envío: mismo mensaje genérico de cualquier forma.
            }
        }

        res.json(genericResponse)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// POST /auth/reset-password — token + newPassword.
export async function resetPassword(req: Request, res: Response) {
    try {
        const { token, newPassword } = req.body
        if (!token || !newPassword) {
            res.status(400).json({ message: 'token y newPassword son obligatorios' })
            return
        }

        const tokenHash = hashToken(token)
        const record = await PasswordResetToken.findOne({
            where: { tokenHash, isUsed: false, expiresAt: { [Op.gt]: new Date() } },
        })

        if (!record) {
            res.status(400).json({ message: 'El enlace de recuperación es inválido, ya fue usado o expiró' })
            return
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await User.update({ password: hashedPassword }, { where: { userID: record.userID } })
        await record.update({ isUsed: true })

        res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
