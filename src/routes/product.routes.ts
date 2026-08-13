// src/routes/product.routes.ts
import { Router } from 'express'
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createSpecialOrderProduct,
} from '../controllers/product.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// NOTA sobre 'edit' en vez de 'create'/'delete' para rutas nuevas: la tabla
// "Configurar cuentas" (OtherAccountSettings_Page) solo expone PERMISO
// LECTURA/EDITAR por persona — canCreate/canDelete no tienen control en esa
// pantalla (solo se siembran una vez desde la plantilla por rol al crear la
// cuenta). Para no depender de esos valores nunca ajustados a mano, todas
// las rutas que protejo por primera vez usan 'edit' (canEdit), que es
// justamente la columna que el admin sí controla por persona.
//
// Se crea desde AddProduct_Page (incluye el borrador reservado al abrir el
// formulario) o RegisterProducts_Page ("Registro Rápido").
router.post('/', authenticateToken, checkPermission(['add-product', 'register-products'], 'edit'), createProduct)
// "Orden Especial" en RegisterOrder_Page — antes de '/:prodCode' para que no
// choque con esa ruta. Usa el permiso ya existente de 'register-order' (con
// canCreate probado, igual que createOrder), no uno nuevo.
router.post('/special-order', authenticateToken, checkPermission('register-order', 'create'), createSpecialOrderProduct)
router.get('/', getProducts)
router.get('/:prodCode', getProductById)
// Se edita desde AddProduct_Page, RegisterProducts_Page, PromotionSetupPage
// (descuento) o el modal de detalles del producto (ProductModal, ver
// "product-details" — mismo permiso sin importar desde qué vista se abrió el modal).
router.put('/:prodCode', authenticateToken, checkPermission(['add-product', 'register-products', 'promotion-setup', 'product-details'], 'edit'), updateProduct)
router.delete('/:prodCode', authenticateToken, checkPermission(['add-product', 'register-products', 'product-details'], 'edit'), deleteProduct)

export default router
