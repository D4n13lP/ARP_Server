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

const router = Router()

router.post('/upload', upload.single('image'), uploadPicture)
router.post('/', createPicture)
router.get('/', getPictures)
router.get('/:pictureID', getPictureById)
router.put('/:pictureID', updatePicture)
router.delete('/:pictureID', deletePicture)

export default router
