// src/controllers/picture.controller.ts
import type { Request, Response } from 'express'
import { Picture } from '../models/index.js'
import cloudinary from '../config/cloudinary.js'

export async function createPicture(req: Request, res: Response) {
    try {
        const item = await Picture.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// Recibe un archivo (multipart/form-data, campo "image") vía multer,
// lo sube a Cloudinary y guarda el resultado como un registro de Picture.
// El public_id de Cloudinary se guarda en "name" para poder borrarlo después.
export async function uploadPicture(req: Request, res: Response) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No se recibió ninguna imagen' })
            return
        }

        const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'acabados-rusticos-piramides/products' },
                (error, result) => {
                    if (error || !result) {
                        reject(error || new Error('Cloudinary no regresó resultado'))
                        return
                    }
                    resolve(result)
                },
            )
            stream.end(req.file!.buffer)
        })

        const picture = await Picture.create({
            name: result.public_id,
            link: result.secure_url,
            prodCode: req.body.prodCode || null,
        })
        res.status(201).json(picture)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getPictures(req: Request, res: Response) {
    try {
        const items = await Picture.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getPictureById(req: Request, res: Response) {
    try {
        const item = await Picture.findByPk(req.params.pictureID as string)
        if (!item) {
            res.status(404).json({ message: 'Picture no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updatePicture(req: Request, res: Response) {
    try {
        const item = await Picture.findByPk(req.params.pictureID as string)
        if (!item) {
            res.status(404).json({ message: 'Picture no encontrado' })
            return
        }
        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deletePicture(req: Request, res: Response) {
    try {
        const item = await Picture.findByPk(req.params.pictureID as string)
        if (!item) {
            res.status(404).json({ message: 'Picture no encontrado' })
            return
        }
        if (item.name) {
            await cloudinary.uploader.destroy(item.name).catch(() => {})
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
