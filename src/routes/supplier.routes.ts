// src/routes/supplier.routes.ts
import { Router } from 'express'
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
} from '../controllers/supplier.controller.js'

const router = Router()

router.post('/', createSupplier)
router.get('/', getSuppliers)
router.get('/:suppCode', getSupplierById)
router.put('/:suppCode', updateSupplier)
router.delete('/:suppCode', deleteSupplier)

export default router
