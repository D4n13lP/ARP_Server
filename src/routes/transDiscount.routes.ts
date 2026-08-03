// src/routes/transDiscount.routes.ts
import { Router } from 'express'
import {
    createTransDiscount,
    getTransDiscounts,
    getTransDiscountById,
    updateTransDiscount,
    deleteTransDiscount,
} from '../controllers/transDiscount.controller.js'

const router = Router()

router.post('/', createTransDiscount)
router.get('/', getTransDiscounts)
router.get('/:transDiscountID', getTransDiscountById)
router.put('/:transDiscountID', updateTransDiscount)
router.delete('/:transDiscountID', deleteTransDiscount)

export default router
