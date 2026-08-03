// src/routes/transCourier.routes.ts
import { Router } from 'express'
import {
    createTransCourier,
    getTransCouriers,
    getTransCourierById,
    updateTransCourier,
    deleteTransCourier,
} from '../controllers/transCourier.controller.js'

const router = Router()

router.post('/', createTransCourier)
router.get('/', getTransCouriers)
router.get('/:transactionID/:courierID', getTransCourierById)
router.put('/:transactionID/:courierID', updateTransCourier)
router.delete('/:transactionID/:courierID', deleteTransCourier)

export default router
