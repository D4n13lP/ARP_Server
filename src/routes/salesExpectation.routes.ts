// src/routes/salesExpectation.routes.ts
import { Router } from 'express'
import {
    createSalesExpectation,
    getSalesExpectations,
    getSalesExpectationById,
    updateSalesExpectation,
    deleteSalesExpectation,
} from '../controllers/salesExpectation.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea desde AddProduct_Page y también se puede editar/borrar desde el
// modal de detalles del producto (ProductModal, moduleKey "product-details" —
// mismo permiso con el que ya se edita/borra el producto ahí).
router.post('/', authenticateToken, checkPermission(['add-product', 'product-details'], 'edit'), createSalesExpectation)
router.get('/', getSalesExpectations)
router.get('/:expectationID', getSalesExpectationById)
router.put('/:expectationID', authenticateToken, checkPermission(['add-product', 'product-details'], 'edit'), updateSalesExpectation)
router.delete('/:expectationID', authenticateToken, checkPermission(['add-product', 'product-details'], 'edit'), deleteSalesExpectation)

export default router
