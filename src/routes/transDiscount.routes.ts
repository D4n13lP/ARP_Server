// src/routes/transDiscount.routes.ts
import { Router } from 'express'
import {
    createTransDiscount,
    getTransDiscounts,
    getTransDiscountById,
    updateTransDiscount,
    deleteTransDiscount,
} from '../controllers/transDiscount.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Solo se usa desde DiscountAdjustmentPage.
router.post('/', authenticateToken, checkPermission('discount-adjustment', 'edit'), createTransDiscount)
router.get('/', getTransDiscounts)
router.get('/:transDiscountID', getTransDiscountById)
router.put('/:transDiscountID', authenticateToken, checkPermission('discount-adjustment', 'edit'), updateTransDiscount)
router.delete('/:transDiscountID', authenticateToken, checkPermission('discount-adjustment', 'edit'), deleteTransDiscount)

export default router
