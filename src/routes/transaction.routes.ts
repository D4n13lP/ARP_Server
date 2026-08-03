// src/routes/transaction.routes.ts
import { Router } from 'express'
import {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} from '../controllers/transaction.controller.js'

const router = Router()

router.post('/', createTransaction)
router.get('/', getTransactions)
router.get('/:transactionID', getTransactionById)
router.put('/:transactionID', updateTransaction)
router.delete('/:transactionID', deleteTransaction)

export default router
