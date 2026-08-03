// src/controllers/product.controller.ts
import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Product, Category, ProductUnit, Picture, Promo } from '../models/index.js'
import cloudinary from '../config/cloudinary.js'

// Borra de Cloudinary las imágenes de un producto. El borrado en la BD ya
// está resuelto por ON DELETE CASCADE en la tabla "picture", pero esa cascada
// no toca los archivos reales en Cloudinary, así que hay que hacerlo aparte.
async function destroyProductPictures(pictures: Picture[]) {
    await Promise.all(
        pictures.filter((p) => p.name).map((p) => cloudinary.uploader.destroy(p.name!).catch(() => {})),
    )
}

// Los productos "borrador" (reservados por el formulario de alta antes de
// terminar de llenarse) se guardan con productName vacío. Si el usuario
// cierra la pestaña sin terminar, el best-effort de beforeunload puede no
// llegar a ejecutarse, así que aquí barremos los que quedaron huérfanos por
// más de un par de horas cada vez que se listan productos.
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000

async function purgeStaleDrafts() {
    const staleDrafts = await Product.findAll({
        where: {
            productName: '',
            createdAt: { [Op.lt]: new Date(Date.now() - DRAFT_TTL_MS) },
        },
        include: [Picture],
    })
    for (const draft of staleDrafts) {
        await destroyProductPictures(draft.pictures || [])
    }
    await Product.destroy({
        where: { prodCode: staleDrafts.map((d) => d.prodCode) },
    })
}

// Genera un SKU único cuando el cliente no manda uno (p.ej. al reservar un
// producto borrador antes de que el usuario termine de llenar el formulario).
async function generateSku(startingFrom: number): Promise<string> {
    let attempt = startingFrom
    while (true) {
        const candidate = `SKU-${String(attempt).padStart(6, '0')}`
        const exists = await Product.findOne({ where: { sku: candidate } })
        if (!exists) return candidate
        attempt++
    }
}

export async function createProduct(req: Request, res: Response) {
    const payload = { ...req.body }
    const autoSku = !payload.sku

    // Reintenta si dos solicitudes concurrentes generan el mismo SKU
    // (el checar-y-luego-insertar de generateSku no es atómico).
    for (let retries = 0; retries < 5; retries++) {
        try {
            if (autoSku) {
                payload.sku = await generateSku((await Product.count()) + 1 + retries)
            }
            const product = await Product.create(payload)
            res.status(201).json(product)
            return
        } catch (error: any) {
            const isSkuCollision = autoSku && error.name === 'SequelizeUniqueConstraintError' &&
                error.errors?.some((e: any) => e.path === 'sku')
            if (!isSkuCollision) {
                res.status(400).json({ message: error.message })
                return
            }
        }
    }
    res.status(500).json({ message: 'No se pudo generar un SKU único, intenta de nuevo.' })
}

export async function getProducts(req: Request, res: Response) {
    try {
        await purgeStaleDrafts()
        const products = await Product.findAll({
            include: [Category, ProductUnit, Picture, Promo],
            order: [['productName', 'ASC']],
        })
        res.json(products)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getProductById(req: Request, res: Response) {
    try {
        const product = await Product.findByPk(req.params.prodCode as string, {
            include: [Category, ProductUnit, Picture, Promo],
        })
        if (!product) {
            res.status(404).json({ message: 'Producto no encontrado' })
            return
        }
        res.json(product)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateProduct(req: Request, res: Response) {
    try {
        const product = await Product.findByPk(req.params.prodCode as string)
        if (!product) {
            res.status(404).json({ message: 'Producto no encontrado' })
            return
        }
        await product.update(req.body)
        await product.reload({ include: [Category, ProductUnit, Picture, Promo] })
        res.json(product)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteProduct(req: Request, res: Response) {
    try {
        const product = await Product.findByPk(req.params.prodCode as string, { include: [Picture] })
        if (!product) {
            res.status(404).json({ message: 'Producto no encontrado' })
            return
        }
        await destroyProductPictures(product.pictures || [])
        await product.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
