// src/routes/user.routes.ts
import { Router } from 'express'
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    updateMe,
    uploadAvatar,
    deleteUser,
    login,
    promoteUser,
    demoteUser,
    allowUser,
    updateRecoveryEmail,
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = Router()

router.post('/', createUser)
// Lista completa de usuarios (correos, employeeCode, userType...): solo admin.
router.get('/', authenticateToken, authorizeRoles('admin'), getUsers)
router.post('/login', login)

// Rutas del propio usuario autenticado — deben ir antes de '/:userID' para no chocar con ella.
router.put('/me', authenticateToken, updateMe)
router.put('/me/avatar', authenticateToken, upload.single('image'), uploadAvatar)
router.put('/me/recovery-email', authenticateToken, updateRecoveryEmail)

router.get('/:userID', getUserById)
// Edición genérica (incluye userType, password...): solo admin. Cualquier usuario
// edita lo suyo vía PUT /users/me, que solo permite userName y phone.
router.put('/:userID', authenticateToken, authorizeRoles('admin'), updateUser)
// Eliminar cuentas: solo admin.
router.delete('/:userID', authenticateToken, authorizeRoles('admin'), deleteUser)
router.put('/:userID/promote', authenticateToken, authorizeRoles('admin'), promoteUser)
router.put('/:userID/demote', authenticateToken, authorizeRoles('admin'), demoteUser)
router.put('/:userID/allow', authenticateToken, authorizeRoles('admin'), allowUser)

export default router
