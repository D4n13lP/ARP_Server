// src/routes/paymentHistory.routes.ts
import { Router } from 'express'
import {
    createPaymentHistory,
    getPaymentHistorys,
    getPaymentHistoryById,
    updatePaymentHistory,
    deletePaymentHistory,
} from '../controllers/paymentHistory.controller.js'

const router = Router()

router.post('/', createPaymentHistory)
router.get('/', getPaymentHistorys)
router.get('/:pymntHistryID', getPaymentHistoryById)
router.put('/:pymntHistryID', updatePaymentHistory)
router.delete('/:pymntHistryID', deletePaymentHistory)

export default router
