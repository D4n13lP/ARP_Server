// src/routes/inventoryAdjustment.routes.ts
import { Router } from 'express'
import {
    createInventoryAdjustment,
    getInventoryAdjustments,
    getInventoryAdjustmentById,
    updateInventoryAdjustment,
    deleteInventoryAdjustment,
} from '../controllers/inventoryAdjustment.controller.js'

const router = Router()

router.post('/', createInventoryAdjustment)
router.get('/', getInventoryAdjustments)
router.get('/:adjustID', getInventoryAdjustmentById)
router.put('/:adjustID', updateInventoryAdjustment)
router.delete('/:adjustID', deleteInventoryAdjustment)

export default router
