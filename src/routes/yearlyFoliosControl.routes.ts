// src/routes/yearlyFoliosControl.routes.ts
import { Router } from 'express'
import {
    createYearlyFoliosControl,
    getYearlyFoliosControls,
    getYearlyFoliosControlById,
    updateYearlyFoliosControl,
    deleteYearlyFoliosControl,
} from '../controllers/yearlyFoliosControl.controller.js'

const router = Router()

router.post('/', createYearlyFoliosControl)
router.get('/', getYearlyFoliosControls)
router.get('/:year', getYearlyFoliosControlById)
router.put('/:year', updateYearlyFoliosControl)
router.delete('/:year', deleteYearlyFoliosControl)

export default router
