// src/routes/clientProductDiscount.routes.ts
import { Router } from 'express'
import {
    createOrUpdateClientProductDiscount,
    getClientProductDiscounts,
    deleteClientProductDiscount,
} from '../controllers/clientProductDiscount.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Se edita desde ClientsDiscountPage (asignar descuento a un producto) o
// desde ClientDiscountDetail_Page ("Ver descuentos" en Clients_Page, edita
// o borra los ya asignados a un cliente puntual) — basta con el permiso de
// cualquiera de las dos vistas.
const CLIENT_PRODUCT_DISCOUNT_MODULES = ['clients-discount', 'client-product-discounts']
router.post('/', authenticateToken, checkPermission(CLIENT_PRODUCT_DISCOUNT_MODULES, 'edit'), createOrUpdateClientProductDiscount)
router.get('/', getClientProductDiscounts)
router.delete('/:clientProductDiscountID', authenticateToken, checkPermission(CLIENT_PRODUCT_DISCOUNT_MODULES, 'edit'), deleteClientProductDiscount)

export default router
