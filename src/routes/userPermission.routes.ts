// src/routes/userPermission.routes.ts
import { Router } from 'express'
import { getUserPermissions, updateUserPermission, getMyPermissions } from '../controllers/userPermission.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// Antes del gate de admin: cualquier usuario autenticado puede ver los suyos.
router.get('/me', authenticateToken, getMyPermissions)

router.use(authenticateToken, authorizeRoles('admin'))

router.get('/', getUserPermissions)
router.put('/:userID/:moduleID', updateUserPermission)

export default router
