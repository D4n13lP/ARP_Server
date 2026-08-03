// src/routes/transDetail.routes.ts
import { Router } from 'express'
import {
    createTransDetail,
    getTransDetails,
    getTransDetailById,
    updateTransDetail,
    deleteTransDetail,
} from '../controllers/transDetail.controller.js'

const router = Router()

router.post('/', createTransDetail)
router.get('/', getTransDetails)
router.get('/:transDetailID', getTransDetailById)
router.put('/:transDetailID', updateTransDetail)
router.delete('/:transDetailID', deleteTransDetail)

export default router
