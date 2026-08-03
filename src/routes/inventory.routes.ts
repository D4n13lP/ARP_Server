// src/routes/inventory.routes.ts
import { Router } from 'express'
import {
    createInventory,
    getInventorys,
    getInventoryById,
    updateInventory,
    deleteInventory,
} from '../controllers/inventory.controller.js'

const router = Router()

router.post('/', createInventory)
router.get('/', getInventorys)
router.get('/:inventoryID', getInventoryById)
router.put('/:inventoryID', updateInventory)
router.delete('/:inventoryID', deleteInventory)

export default router
