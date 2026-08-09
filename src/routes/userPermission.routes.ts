// src/routes/userPermission.routes.ts
import { Router } from 'express'
import { getUserPermissions, updateUserPermission } from '../controllers/userPermission.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken, authorizeRoles('admin'))

router.get('/', getUserPermissions)
router.put('/:userID/:moduleID', updateUserPermission)

export default router
