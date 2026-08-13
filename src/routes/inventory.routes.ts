// src/routes/inventory.routes.ts
import { Router } from 'express'
import {
    createInventory,
    getInventorys,
    getInventoryById,
    updateInventory,
    transferInventory,
    deleteInventory,
} from '../controllers/inventory.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea (asignar un producto a un almacén por primera vez) desde
// AddProduct_Page o RegisterProducts_Page.
router.post('/', authenticateToken, checkPermission(['add-product', 'register-products'], 'edit'), createInventory)
// Transferir stock entre almacenes o ingresar stock nuevo (ver transferInventory)
// — mismo permiso que editar cantidades.
router.post('/transfer', authenticateToken, checkPermission('inventory', 'edit'), transferInventory)
router.get('/', getInventorys)
router.get('/:inventoryID', getInventoryById)
// Editar cantidades: admin, o vendedor con canEdit activado para el módulo
// 'inventory' (ver "Vistas permitidas" / columna "PERMISO EDITAR" en
// OtherAccountSettings_Page).
router.put('/:inventoryID', authenticateToken, checkPermission('inventory', 'edit'), updateInventory)
// Eliminar registro de inventario (solo con cantidad 0, ver Inventory.tsx) — mismo permiso.
router.delete('/:inventoryID', authenticateToken, checkPermission('inventory', 'edit'), deleteInventory)

export default router
