// src/routes/courier.routes.ts
import { Router } from 'express'
import {
    createCourier,
    getCouriers,
    getCourierById,
    updateCourier,
    deleteCourier,
} from '../controllers/courier.controller.js'

const router = Router()

router.post('/', createCourier)
router.get('/', getCouriers)
router.get('/:courierID', getCourierById)
router.put('/:courierID', updateCourier)
router.delete('/:courierID', deleteCourier)

export default router
