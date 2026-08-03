// src/routes/transDestAcc.routes.ts
import { Router } from 'express'
import {
    createTransDestAcc,
    getTransDestAccs,
    getTransDestAccById,
    updateTransDestAcc,
    deleteTransDestAcc,
} from '../controllers/transDestAcc.controller.js'

const router = Router()

router.post('/', createTransDestAcc)
router.get('/', getTransDestAccs)
router.get('/:transactionID/:clabe', getTransDestAccById)
router.put('/:transactionID/:clabe', updateTransDestAcc)
router.delete('/:transactionID/:clabe', deleteTransDestAcc)

export default router
