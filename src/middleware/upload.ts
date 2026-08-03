// src/middleware/upload.ts
import multer from 'multer'

// Guarda el archivo en memoria (buffer) para subirlo directo a Cloudinary,
// sin escribirlo primero en disco.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Solo se permiten archivos de imagen'))
            return
        }
        cb(null, true)
    },
})

export default upload
