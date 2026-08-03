// src/routes/category.routes.ts
import { Router } from 'express'
import {
    createCategory,
    getCategorys,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from '../controllers/category.controller.js'

const router = Router()

router.post('/', createCategory)
router.get('/', getCategorys)
router.get('/:categoryID', getCategoryById)
router.put('/:categoryID', updateCategory)
router.delete('/:categoryID', deleteCategory)

export default router
