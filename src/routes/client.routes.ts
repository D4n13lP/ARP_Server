// src/routes/client.routes.ts
import { Router } from 'express'
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
} from '../controllers/client.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se crea/elimina desde Clients_Page; se edita también desde
// ClientsDiscountPage (asignar descuento) o al registrar una venta/pedido
// nuevo con "Cliente no registrado" (newClient en processTransaction — eso
// pasa por transaction.controller.ts, ya protegido con su propio permiso,
// así que aquí no hace falta agregar register-sale/register-order).
router.post('/', authenticateToken, checkPermission('clients', 'edit'), createClient)
router.get('/', getClients)
router.get('/:clientCode', getClientById)
router.put('/:clientCode', authenticateToken, checkPermission(['clients', 'clients-discount'], 'edit'), updateClient)
router.delete('/:clientCode', authenticateToken, checkPermission('clients', 'edit'), deleteClient)

export default router
