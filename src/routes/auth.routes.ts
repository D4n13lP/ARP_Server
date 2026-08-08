// src/routes/auth.routes.ts
import { Router } from 'express'
import {
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', register)
router.get('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
