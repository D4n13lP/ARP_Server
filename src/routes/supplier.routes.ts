// src/routes/supplier.routes.ts
import { Router } from 'express'
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
} from '../controllers/supplier.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea desde AddProduct_Page, RegisterSupplier_Page o el modal de
// detalles del producto (proveedor nuevo escrito a mano); se edita/elimina
// desde SupplierDetail_Page.
router.post('/', authenticateToken, checkPermission(['add-product', 'register-supplier', 'product-details'], 'edit'), createSupplier)
router.get('/', getSuppliers)
router.get('/:suppCode', getSupplierById)
router.put('/:suppCode', authenticateToken, checkPermission('supplier-detail', 'edit'), updateSupplier)
router.delete('/:suppCode', authenticateToken, checkPermission('supplier-detail', 'edit'), deleteSupplier)

export default router
