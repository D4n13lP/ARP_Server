// src/controllers/product.controller.ts
import type { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Product, Category, ProductUnit, Picture, Promo, Supplier, Inventory, Warehouse, TransDetail } from '../models/index.js'
import cloudinary from '../config/cloudinary.js'
import db from '../config/db.js'

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

// Productos armados al vuelo desde "Orden Especial" (prodType 'custom') que
// se quedaron abandonados: el cajero llenó el formulario y creó el producto
// + su inventario en "Pedido especial", pero nunca terminó de registrar la
// venta/pedido. Se barren igual que los borradores de arriba, pero con más
// margen (48h, no un par de horas) y NUNCA se toca uno que sí llegó a
// aparecer en una transacción real (transDetail) — eso sería borrar historial.
const SPECIAL_ORDER_PRODUCT_TTL_MS = 48 * 60 * 60 * 1000

async function purgeAbandonedSpecialOrderProducts() {
    const candidates = await Product.findAll({
        where: {
            prodType: 'custom',
            createdAt: { [Op.lt]: new Date(Date.now() - SPECIAL_ORDER_PRODUCT_TTL_MS) },
        },
    })
    for (const product of candidates) {
        const usedInTransactions = await TransDetail.count({ where: { prodCode: product.prodCode } })
        if (usedInTransactions > 0) continue
        await db.transaction(async (t) => {
            await Inventory.destroy({ where: { prodCode: product.prodCode }, transaction: t })
            await product.destroy({ transaction: t })
        })
    }
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

// Nombre fijo del almacén "de contenedor" para productos armados al vuelo
// desde "Orden Especial" (RegisterOrder_Page) — se crea solo la primera vez.
const SPECIAL_ORDER_WAREHOUSE_NAME = 'Pedido especial'

// POST /products/special-order — "Orden Especial" en RegisterOrder_Page: en
// un solo paso crea un producto ad-hoc (prodType 'custom', prodCode/sku
// automáticos, igual que createProduct) y lo ingresa al almacén fijo "Pedido
// especial" (se crea solo si no existe todavía). Es la ÚNICA vía que puede
// meterle stock a ese almacén — createInventory/updateInventory/
// transferInventory lo tienen bloqueado como destino a propósito.
export async function createSpecialOrderProduct(req: Request, res: Response) {
    try {
        const { productName, description, salePrice, produnitID, quantity } = req.body as {
            productName?: string
            description?: string | null
            salePrice?: number
            produnitID?: string | null
            quantity?: number
        }

        if (!productName?.trim()) {
            res.status(400).json({ message: 'El nombre del producto es obligatorio' })
            return
        }
        const qty = Number(quantity)
        if (!Number.isInteger(qty) || qty < 1) {
            res.status(400).json({ message: 'La cantidad debe ser un entero de 1 o más' })
            return
        }

        // Las 3 escrituras (producto, almacén y su inventario) van en una sola
        // transacción — antes iban sueltas, y si algo fallaba justo entre
        // crear el producto y crear su inventario (una desconexión, un error
        // de validación tardío, etc.) quedaba un producto "custom" huérfano
        // sin ninguna fila de inventario, imposible de ubicar en un almacén
        // después y sin forma clara de borrarlo.
        const inventory = await db.transaction(async (t) => {
            let product: Product | null = null
            for (let retries = 0; retries < 5; retries++) {
                try {
                    const sku = await generateSku((await Product.count({ transaction: t })) + 1 + retries)
                    product = await Product.create({
                        productName: productName.trim(),
                        description: description?.trim() || null,
                        prodType: 'custom',
                        sku,
                        cost: 0,
                        salePrice: Number(salePrice) || 0,
                        produnitID: produnitID || null,
                    }, { transaction: t })
                    break
                } catch (error: any) {
                    const isSkuCollision = error.name === 'SequelizeUniqueConstraintError' &&
                        error.errors?.some((e: any) => e.path === 'sku')
                    if (!isSkuCollision) throw error
                }
            }
            if (!product) {
                throw new Error('No se pudo generar un SKU único, intenta de nuevo.')
            }

            const [warehouse] = await Warehouse.findOrCreate({
                where: { whname: SPECIAL_ORDER_WAREHOUSE_NAME },
                defaults: { whname: SPECIAL_ORDER_WAREHOUSE_NAME, isSpecialOrders: true },
                transaction: t,
            })
            // "defaults" de findOrCreate solo se aplica al CREAR — si la fila ya
            // existía (por ejemplo de antes de tener esta columna) y se quedó con
            // la bandera en false, se corrige aquí para que quede protegida.
            if (!warehouse.isSpecialOrders) {
                await warehouse.update({ isSpecialOrders: true }, { transaction: t })
            }

            const created = await Inventory.create({ prodCode: product.prodCode, whID: warehouse.whID, quantity: qty }, { transaction: t })
            await created.reload({ include: [{ model: Product, include: [ProductUnit] }, Warehouse], transaction: t })
            return created
        })

        res.status(201).json(inventory)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getProducts(req: Request, res: Response) {
    try {
        await purgeStaleDrafts()
        await purgeAbandonedSpecialOrderProducts()
        const products = await Product.findAll({
            include: [Category, ProductUnit, Picture, Promo, Supplier],
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
            include: [Category, ProductUnit, Picture, Promo, Supplier],
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
        await product.reload({ include: [Category, ProductUnit, Picture, Promo, Supplier] })
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
        // El producto ya aparece en al menos una venta/pedido real
        // (transDetail lo referencia con RESTRICT) — no se puede borrar sin
        // romper ese historial. Mensaje claro en vez del error crudo de Postgres.
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).json({ message: 'No se puede eliminar: este producto ya se usó en una venta o pedido registrado.' })
            return
        }
        res.status(500).json({ message: error.message })
    }
}
