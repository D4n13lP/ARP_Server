// src/routes/destAccount.routes.ts
import { Router } from 'express'
import {
    createDestAccount,
    getDestAccounts,
    getDestAccountById,
    updateDestAccount,
    deleteDestAccount,
} from '../controllers/destAccount.controller.js'

const router = Router()

router.post('/', createDestAccount)
router.get('/', getDestAccounts)
router.get('/:clabe', getDestAccountById)
router.put('/:clabe', updateDestAccount)
router.delete('/:clabe', deleteDestAccount)

export default router
