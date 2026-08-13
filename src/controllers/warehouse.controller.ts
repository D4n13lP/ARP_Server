// src/controllers/warehouse.controller.ts
import type { Request, Response } from 'express'
import { Warehouse, Inventory } from '../models/index.js'

// Blindaje extra: además de la bandera isSpecialOrders, cualquier almacén
// con este nombre exacto queda protegido — cubre el caso de una fila que ya
// existiera con el nombre pero sin la bandera puesta (creada antes de tener
// esta columna, o duplicada a mano).
const SPECIAL_ORDER_WAREHOUSE_NAME = 'Pedido especial'
function isProtected(wh: Warehouse): boolean {
    return !!wh.isSpecialOrders || wh.whname === SPECIAL_ORDER_WAREHOUSE_NAME
}

export async function createWarehouse(req: Request, res: Response) {
    try {
        const item = await Warehouse.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getWarehouses(req: Request, res: Response) {
    try {
        const items = await Warehouse.findAll()
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getWarehouseById(req: Request, res: Response) {
    try {
        const item = await Warehouse.findByPk(req.params.whID as string)
        if (!item) {
            res.status(404).json({ message: 'Warehouse no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateWarehouse(req: Request, res: Response) {
    try {
        const item = await Warehouse.findByPk(req.params.whID as string)
        if (!item) {
            res.status(404).json({ message: 'Warehouse no encontrado' })
            return
        }

        // El almacén fijo "Pedido especial" (Orden Especial en
        // RegisterOrder_Page) no se puede renombrar — sus demás atributos
        // (dirección, etc.) sí son editables normalmente.
        if (isProtected(item) && typeof req.body.whname === 'string' && req.body.whname !== item.whname) {
            res.status(400).json({ message: 'No se puede renombrar el almacén de Pedidos especiales.' })
            return
        }

        await item.update(req.body)
        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteWarehouse(req: Request, res: Response) {
    try {
        const item = await Warehouse.findByPk(req.params.whID as string)
        if (!item) {
            res.status(404).json({ message: 'Warehouse no encontrado' })
            return
        }

        // No se permite eliminar un almacén que todavía tiene productos
        // asignados (fila en "inventory") — en el frontend el botón
        // "Eliminar" ya se oculta en ese caso, pero se valida aquí también.
        const productCount = await Inventory.count({ where: { whID: item.whID } })
        if (productCount > 0) {
            res.status(400).json({ message: 'No se puede eliminar: este almacén todavía tiene productos relacionados.' })
            return
        }

        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
