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
    updateRecoveryEmail,
} from '../controllers/user.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

router.post('/', createUser)
router.get('/', getUsers)
router.post('/login', login)

// Rutas del propio usuario autenticado — deben ir antes de '/:userID' para no chocar con ella.
router.put('/me/recovery-email', authenticateToken, updateRecoveryEmail)

router.get('/:userID', getUserById)
router.put('/:userID', updateUser)
router.delete('/:userID', deleteUser)
router.put('/:userID/promote', authenticateToken, authorizeRoles('admin'), promoteUser)

export default router
