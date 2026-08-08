// src/routes/rolePermission.routes.ts
import { Router } from 'express'
import {
    createRolePermission,
    getRolePermissions,
    getRolePermissionById,
    updateRolePermission,
    deleteRolePermission,
} from '../controllers/rolePermission.controller.js'

const router = Router()

router.post('/', createRolePermission)
router.get('/', getRolePermissions)
router.get('/:permissionID', getRolePermissionById)
router.put('/:permissionID', updateRolePermission)
router.patch('/:permissionID', updateRolePermission)
router.delete('/:permissionID', deleteRolePermission)

export default router
