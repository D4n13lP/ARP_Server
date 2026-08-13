// src/routes/courier.routes.ts
import { Router } from 'express'
import {
    createCourier,
    getCouriers,
    getCourierById,
    updateCourier,
    deleteCourier,
} from '../controllers/courier.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Solo se usa desde Deliverymen_Page.
router.post('/', authenticateToken, checkPermission('deliverymen', 'edit'), createCourier)
router.get('/', getCouriers)
router.get('/:courierID', getCourierById)
router.put('/:courierID', authenticateToken, checkPermission('deliverymen', 'edit'), updateCourier)
router.delete('/:courierID', authenticateToken, checkPermission('deliverymen', 'edit'), deleteCourier)

export default router
