// src/routes/client.routes.ts
import { Router } from 'express'
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
} from '../controllers/client.controller.js'

const router = Router()

router.post('/', createClient)
router.get('/', getClients)
router.get('/:clientCode', getClientById)
router.put('/:clientCode', updateClient)
router.delete('/:clientCode', deleteClient)

export default router
