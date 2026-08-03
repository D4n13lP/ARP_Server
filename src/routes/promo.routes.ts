// src/routes/promo.routes.ts
import { Router } from 'express'
import {
    createPromo,
    getPromos,
    getPromoById,
    updatePromo,
    deletePromo,
} from '../controllers/promo.controller.js'

const router = Router()

router.post('/', createPromo)
router.get('/', getPromos)
router.get('/:discountID', getPromoById)
router.put('/:discountID', updatePromo)
router.delete('/:discountID', deletePromo)

export default router
