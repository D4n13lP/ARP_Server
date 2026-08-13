// src/routes/category.routes.ts
import { Router } from 'express'
import {
    createCategory,
    getCategorys,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from '../controllers/category.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea desde AddProduct_Page, RegisterProducts_Page o el modal de
// detalles del producto (categoría nueva escrita a mano); se edita (p. ej.
// para asignarle un descuento) desde PromotionSetupPage.
const CATEGORY_MODULES = ['add-product', 'register-products', 'product-details', 'promotion-setup']
router.post('/', authenticateToken, checkPermission(CATEGORY_MODULES, 'edit'), createCategory)
router.get('/', getCategorys)
router.get('/:categoryID', getCategoryById)
router.put('/:categoryID', authenticateToken, checkPermission(CATEGORY_MODULES, 'edit'), updateCategory)
router.delete('/:categoryID', authenticateToken, checkPermission(CATEGORY_MODULES, 'edit'), deleteCategory)

export default router
