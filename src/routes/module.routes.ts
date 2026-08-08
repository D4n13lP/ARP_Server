// src/routes/module.routes.ts
import { Router } from 'express'
import {
    createModule,
    getModules,
    getModuleById,
    updateModule,
    deleteModule,
} from '../controllers/module.controller.js'

const router = Router()

router.post('/', createModule)
router.get('/', getModules)
router.get('/:moduleID', getModuleById)
router.put('/:moduleID', updateModule)
router.patch('/:moduleID', updateModule)
router.delete('/:moduleID', deleteModule)

export default router
