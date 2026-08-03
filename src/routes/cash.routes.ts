// src/routes/cash.routes.ts
import { Router } from 'express'
import {
    createCash,
    getCashs,
    getCashById,
    updateCash,
    deleteCash,
} from '../controllers/cash.controller.js'

const router = Router()

router.post('/', createCash)
router.get('/', getCashs)
router.get('/:cashID', getCashById)
router.put('/:cashID', updateCash)
router.delete('/:cashID', deleteCash)

export default router
