// src/routes/suppProd.routes.ts
import { Router } from 'express'
import {
    createSuppProd,
    getSuppProds,
    getSuppProdById,
    updateSuppProd,
    deleteSuppProd,
} from '../controllers/suppProd.controller.js'

const router = Router()

router.post('/', createSuppProd)
router.get('/', getSuppProds)
router.get('/:suppCode/:prodCode', getSuppProdById)
router.put('/:suppCode/:prodCode', updateSuppProd)
router.delete('/:suppCode/:prodCode', deleteSuppProd)

export default router
