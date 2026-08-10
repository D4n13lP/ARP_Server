// src/routes/transaction.routes.ts
import { Router } from 'express'
import {
    createSale,
    createOrder,
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    addPayment,
    deleteTransaction,
} from '../controllers/transaction.controller.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Registrar una venta completa (descuenta inventario, crea transacción +
// renglones + pago, etc.) — mismo permiso que la pantalla "Registrar venta".
router.post('/sale', authenticateToken, checkPermission('register-sale', 'create'), createSale)
// Igual pero para pedidos (puede quedar con anticipo parcial o sin ninguno).
router.post('/order', authenticateToken, checkPermission('register-order', 'create'), createOrder)
router.post('/', createTransaction)
router.get('/', getTransactions)
router.get('/:transactionID', getTransactionById)
// Editar (estado de entrega, etc.) y abonar un pago — mismo permiso que
// "Actualizar pedido".
router.put('/:transactionID', authenticateToken, checkPermission('update-order', 'edit'), updateTransaction)
router.post('/:transactionID/payments', authenticateToken, checkPermission('update-order', 'edit'), addPayment)
router.delete('/:transactionID', deleteTransaction)

export default router
