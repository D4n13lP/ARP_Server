// src/routes/timeUnit.routes.ts
import { Router } from 'express'
import {
    createTimeUnit,
    getTimeUnits,
    getTimeUnitById,
    updateTimeUnit,
    deleteTimeUnit,
} from '../controllers/timeUnit.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Solo se usa desde AddProduct_Page.
router.post('/', authenticateToken, checkPermission('add-product', 'edit'), createTimeUnit)
router.get('/', getTimeUnits)
router.get('/:timeunitID', getTimeUnitById)
router.put('/:timeunitID', authenticateToken, checkPermission('add-product', 'edit'), updateTimeUnit)
router.delete('/:timeunitID', authenticateToken, checkPermission('add-product', 'edit'), deleteTimeUnit)

export default router
