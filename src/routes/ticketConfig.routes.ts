// src/routes/ticketConfig.routes.ts
import { Router } from 'express'
import { getTicketConfig, updateTicketConfig } from '../controllers/ticketConfig.controller.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// Cualquier usuario autenticado (vendedor o admin) lo necesita para imprimir.
router.get('/', authenticateToken, getTicketConfig)
// Editar el formato/etiquetas del ticket: solo admin (ver Editar Ticket y
// etiquetas en el side menu, oculto para vendedores).
router.put('/', authenticateToken, authorizeRoles('admin'), updateTicketConfig)

export default router
