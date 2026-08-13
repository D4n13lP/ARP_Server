// src/routes/warehouse.routes.ts
import { Router } from 'express'
import {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
} from '../controllers/warehouse.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea/edita/elimina desde Warehouses_Page, o se crea también desde
// AddProduct_Page (almacén nuevo escrito a mano en ese formulario).
const WAREHOUSE_MODULES = ['warehouses', 'add-product']
router.post('/', authenticateToken, checkPermission(WAREHOUSE_MODULES, 'edit'), createWarehouse)
router.get('/', getWarehouses)
router.get('/:whID', getWarehouseById)
router.put('/:whID', authenticateToken, checkPermission(WAREHOUSE_MODULES, 'edit'), updateWarehouse)
router.delete('/:whID', authenticateToken, checkPermission(WAREHOUSE_MODULES, 'edit'), deleteWarehouse)

export default router
