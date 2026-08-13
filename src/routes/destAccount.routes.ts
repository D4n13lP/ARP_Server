// src/routes/destAccount.routes.ts
import { Router } from 'express'
import {
    createDestAccount,
    getDestAccounts,
    getDestAccountById,
    updateDestAccount,
    deleteDestAccount,
} from '../controllers/destAccount.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Solo se usa desde RegisterDestinationAccount_Page.
router.post('/', authenticateToken, checkPermission('destination-account', 'edit'), createDestAccount)
router.get('/', getDestAccounts)
router.get('/:clabe', getDestAccountById)
router.put('/:clabe', authenticateToken, checkPermission('destination-account', 'edit'), updateDestAccount)
router.delete('/:clabe', authenticateToken, checkPermission('destination-account', 'edit'), deleteDestAccount)

export default router
