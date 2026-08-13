// src/routes/suppProd.routes.ts
import { Router } from 'express'
import {
    createSuppProd,
    getSuppProds,
    getSuppProdById,
    updateSuppProd,
    deleteSuppProd,
} from '../controllers/suppProd.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Vincular/desvincular proveedor-producto: desde AddProduct_Page o el modal
// de detalles del producto.
const SUPPROD_MODULES = ['add-product', 'product-details']
router.post('/', authenticateToken, checkPermission(SUPPROD_MODULES, 'edit'), createSuppProd)
router.get('/', getSuppProds)
router.get('/:suppCode/:prodCode', getSuppProdById)
router.put('/:suppCode/:prodCode', authenticateToken, checkPermission(SUPPROD_MODULES, 'edit'), updateSuppProd)
router.delete('/:suppCode/:prodCode', authenticateToken, checkPermission(SUPPROD_MODULES, 'edit'), deleteSuppProd)

export default router
