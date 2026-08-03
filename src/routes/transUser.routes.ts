// src/routes/transUser.routes.ts
import { Router } from 'express'
import {
    createTransUser,
    getTransUsers,
    getTransUserById,
    updateTransUser,
    deleteTransUser,
} from '../controllers/transUser.controller.js'

const router = Router()

router.post('/', createTransUser)
router.get('/', getTransUsers)
router.get('/:transactionID/:userID', getTransUserById)
router.put('/:transactionID/:userID', updateTransUser)
router.delete('/:transactionID/:userID', deleteTransUser)

export default router
