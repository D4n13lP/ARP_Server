// src/routes/promo.routes.ts
import { Router } from 'express'
import {
    createPromo,
    getPromos,
    getPromoById,
    updatePromo,
    deletePromo,
} from '../controllers/promo.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea/edita desde PromotionSetupPage, o se edita también desde el modal
// de detalles del producto (porcentaje de descuento del producto).
const PROMO_MODULES = ['promotion-setup', 'product-details']
router.post('/', authenticateToken, checkPermission(PROMO_MODULES, 'edit'), createPromo)
router.get('/', getPromos)
router.get('/:discountID', getPromoById)
router.put('/:discountID', authenticateToken, checkPermission(PROMO_MODULES, 'edit'), updatePromo)
router.delete('/:discountID', authenticateToken, checkPermission(PROMO_MODULES, 'edit'), deletePromo)

export default router
