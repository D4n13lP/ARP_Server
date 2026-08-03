// src/routes/totalCash.routes.ts
import { Router } from 'express'
import {
    createTotalCash,
    getTotalCashs,
    getTotalCashById,
    updateTotalCash,
    deleteTotalCash,
} from '../controllers/totalCash.controller.js'

const router = Router()

router.post('/', createTotalCash)
router.get('/', getTotalCashs)
router.get('/:totalCashID', getTotalCashById)
router.put('/:totalCashID', updateTotalCash)
router.delete('/:totalCashID', deleteTotalCash)

export default router
