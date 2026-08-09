// src/routes/user.routes.ts
import { Router } from 'express'
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    login,
    promoteUser,
    demoteUser,
    updateRecoveryEmail,
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

router.post('/', createUser)
// Lista completa de usuarios (correos, employeeCode, userType...): solo admin.
router.get('/', authenticateToken, authorizeRoles('admin'), getUsers)
router.post('/login', login)

// Rutas del propio usuario autenticado — deben ir antes de '/:userID' para no chocar con ella.
router.put('/me/recovery-email', authenticateToken, updateRecoveryEmail)

router.get('/:userID', getUserById)
router.put('/:userID', updateUser)
// Eliminar cuentas: solo admin.
router.delete('/:userID', authenticateToken, authorizeRoles('admin'), deleteUser)
router.put('/:userID/promote', authenticateToken, authorizeRoles('admin'), promoteUser)
router.put('/:userID/demote', authenticateToken, authorizeRoles('admin'), demoteUser)

export default router
