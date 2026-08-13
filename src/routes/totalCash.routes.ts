// src/routes/totalCash.routes.ts
import { Router } from 'express'
import {
    createTotalCash,
    getTotalCashs,
    getTotalCashById,
    updateTotalCash,
    deleteTotalCash,
} from '../controllers/totalCash.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Registrar un retiro: solo desde Retiros_Page.
router.post('/', authenticateToken, checkPermission('retiros', 'edit'), createTotalCash)
router.get('/', getTotalCashs)
router.get('/:totalCashID', getTotalCashById)
router.put('/:totalCashID', authenticateToken, checkPermission('retiros', 'edit'), updateTotalCash)
router.delete('/:totalCashID', authenticateToken, checkPermission('retiros', 'edit'), deleteTotalCash)

export default router
