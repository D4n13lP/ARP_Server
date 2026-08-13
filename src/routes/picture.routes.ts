// src/routes/picture.routes.ts
import { Router } from 'express'
import {
    createPicture,
    getPictures,
    getPictureById,
    updatePicture,
    deletePicture,
    uploadPicture,
} from '../controllers/picture.controller.js'
import upload from '../middleware/upload.js'
import { authenticateToken, checkPermission } from '../middleware/auth.js'

const router = Router()

// Subir/editar/borrar imágenes de producto: solo desde AddProduct_Page o el
// modal de detalles del producto.
const PICTURE_MODULES = ['add-product', 'product-details']
router.post('/upload', authenticateToken, checkPermission(PICTURE_MODULES, 'edit'), upload.single('image'), uploadPicture)
router.post('/', authenticateToken, checkPermission(PICTURE_MODULES, 'edit'), createPicture)
router.get('/', getPictures)
router.get('/:pictureID', getPictureById)
router.put('/:pictureID', authenticateToken, checkPermission(PICTURE_MODULES, 'edit'), updatePicture)
router.delete('/:pictureID', authenticateToken, checkPermission(PICTURE_MODULES, 'edit'), deletePicture)

export default router
