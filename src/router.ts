// src/router.ts
import { Router } from 'express'
import cashRoutes from './routes/cash.routes.js'
import categoryRoutes from './routes/category.routes.js'
import clientRoutes from './routes/client.routes.js'
import courierRoutes from './routes/courier.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import destAccountRoutes from './routes/destAccount.routes.js'
import inventoryRoutes from './routes/inventory.routes.js'
import inventoryAdjustmentRoutes from './routes/inventoryAdjustment.routes.js'
import paymentHistoryRoutes from './routes/paymentHistory.routes.js'
import pictureRoutes from './routes/picture.routes.js'
import productUnitRoutes from './routes/productUnit.routes.js'
import productRoutes from './routes/product.routes.js'
import promoRoutes from './routes/promo.routes.js'
import salesExpectationRoutes from './routes/salesExpectation.routes.js'
import suppProdRoutes from './routes/suppProd.routes.js'
import supplierRoutes from './routes/supplier.routes.js'
import timeUnitRoutes from './routes/timeUnit.routes.js'
import totalCashRoutes from './routes/totalCash.routes.js'
import transCourierRoutes from './routes/transCourier.routes.js'
import transDestAccRoutes from './routes/transDestAcc.routes.js'
import transDetailRoutes from './routes/transDetail.routes.js'
import transDiscountRoutes from './routes/transDiscount.routes.js'
import transUserRoutes from './routes/transUser.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import userRoutes from './routes/user.routes.js'
import warehouseRoutes from './routes/warehouse.routes.js'
import yearlyFoliosControlRoutes from './routes/yearlyFoliosControl.routes.js'

const router = Router()

router.use('/api/cash', cashRoutes)
router.use('/api/categories', categoryRoutes)
router.use('/api/clients', clientRoutes)
router.use('/api/couriers', courierRoutes)
router.use('/api/dashboard', dashboardRoutes)
router.use('/api/dest-accounts', destAccountRoutes)
router.use('/api/inventories', inventoryRoutes)
router.use('/api/inventory-adjustments', inventoryAdjustmentRoutes)
router.use('/api/payment-histories', paymentHistoryRoutes)
router.use('/api/pictures', pictureRoutes)
router.use('/api/product-units', productUnitRoutes)
router.use('/api/products', productRoutes)
router.use('/api/promos', promoRoutes)
router.use('/api/sales-expectations', salesExpectationRoutes)
router.use('/api/supp-prods', suppProdRoutes)
router.use('/api/suppliers', supplierRoutes)
router.use('/api/time-units', timeUnitRoutes)
router.use('/api/total-cash', totalCashRoutes)
router.use('/api/trans-couriers', transCourierRoutes)
router.use('/api/trans-dest-accs', transDestAccRoutes)
router.use('/api/trans-details', transDetailRoutes)
router.use('/api/trans-discounts', transDiscountRoutes)
router.use('/api/trans-users', transUserRoutes)
router.use('/api/transactions', transactionRoutes)
router.use('/api/users', userRoutes)
router.use('/api/warehouses', warehouseRoutes)
router.use('/api/yearly-folios-control', yearlyFoliosControlRoutes)

export default router
