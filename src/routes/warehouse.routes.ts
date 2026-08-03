// src/routes/warehouse.routes.ts
import { Router } from 'express'
import {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
} from '../controllers/warehouse.controller.js'

const router = Router()

router.post('/', createWarehouse)
router.get('/', getWarehouses)
router.get('/:whID', getWarehouseById)
router.put('/:whID', updateWarehouse)
router.delete('/:whID', deleteWarehouse)

export default router
