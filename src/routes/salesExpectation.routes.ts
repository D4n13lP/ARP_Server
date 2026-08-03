// src/routes/salesExpectation.routes.ts
import { Router } from 'express'
import {
    createSalesExpectation,
    getSalesExpectations,
    getSalesExpectationById,
    updateSalesExpectation,
    deleteSalesExpectation,
} from '../controllers/salesExpectation.controller.js'

const router = Router()

router.post('/', createSalesExpectation)
router.get('/', getSalesExpectations)
router.get('/:expectationID', getSalesExpectationById)
router.put('/:expectationID', updateSalesExpectation)
router.delete('/:expectationID', deleteSalesExpectation)

export default router
