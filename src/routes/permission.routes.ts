// src/routes/permission.routes.ts
import { Router } from 'express'
import { getPermissions, updatePermission } from '../controllers/permission.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken, authorizeRoles('admin'))

router.get('/', getPermissions)
router.put('/:userType/:moduleID', updatePermission)

export default router
