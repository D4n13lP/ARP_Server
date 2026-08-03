// src/routes/timeUnit.routes.ts
import { Router } from 'express'
import {
    createTimeUnit,
    getTimeUnits,
    getTimeUnitById,
    updateTimeUnit,
    deleteTimeUnit,
} from '../controllers/timeUnit.controller.js'

const router = Router()

router.post('/', createTimeUnit)
router.get('/', getTimeUnits)
router.get('/:timeunitID', getTimeUnitById)
router.put('/:timeunitID', updateTimeUnit)
router.delete('/:timeunitID', deleteTimeUnit)

export default router
