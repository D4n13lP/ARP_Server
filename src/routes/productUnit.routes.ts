// src/routes/productUnit.routes.ts
import { Router } from 'express'
import {
    createProductUnit,
    getProductUnits,
    getProductUnitById,
    updateProductUnit,
    deleteProductUnit,
} from '../controllers/productUnit.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea desde AddProduct_Page, el modal de detalles del producto, o el
// formulario de "Orden Especial" en RegisterOrder_Page (unidad nueva escrita a mano).
const UNIT_MODULES = ['add-product', 'product-details', 'register-order']
router.post('/', authenticateToken, checkPermission(UNIT_MODULES, 'edit'), createProductUnit)
router.get('/', getProductUnits)
router.get('/:produnitID', getProductUnitById)
router.put('/:produnitID', authenticateToken, checkPermission(UNIT_MODULES, 'edit'), updateProductUnit)
router.delete('/:produnitID', authenticateToken, checkPermission(UNIT_MODULES, 'edit'), deleteProductUnit)

export default router
