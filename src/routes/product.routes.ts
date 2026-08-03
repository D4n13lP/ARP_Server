// src/routes/product.routes.ts
import { Router } from 'express'
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from '../controllers/product.controller.js'

const router = Router()

router.post('/', createProduct)
router.get('/', getProducts)
router.get('/:prodCode', getProductById)
router.put('/:prodCode', updateProduct)
router.delete('/:prodCode', deleteProduct)

export default router
