// src/routes/productUnit.routes.ts
import { Router } from 'express'
import {
    createProductUnit,
    getProductUnits,
    getProductUnitById,
    updateProductUnit,
    deleteProductUnit,
} from '../controllers/productUnit.controller.js'

const router = Router()

router.post('/', createProductUnit)
router.get('/', getProductUnits)
router.get('/:produnitID', getProductUnitById)
router.put('/:produnitID', updateProductUnit)
router.delete('/:produnitID', deleteProductUnit)

export default router
