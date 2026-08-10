// src/controllers/inventory.controller.ts
import type { Request, Response } from 'express'
import { Inventory, Product, Warehouse, Category, ProductUnit, Picture, Promo, InventoryAdjustment } from '../models/index.js'

export async function createInventory(req: Request, res: Response) {
    try {
        const item = await Inventory.create(req.body)
        res.status(201).json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function getInventorys(req: Request, res: Response) {
    try {
        const items = await Inventory.findAll({
            // Category/ProductUnit/Picture/Promo: lo que necesita el frontend para
            // mostrar "tiene descuento" y para poder abrir el ProductModal completo
            // desde el botón "Ver" sin pedir el producto aparte.
            include: [{ model: Product, include: [Category, ProductUnit, Picture, Promo] }, Warehouse],
        })
        res.json(items)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getInventoryById(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        res.json(item)
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateInventory(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }

        const previousQuantity = item.quantity
        const previousWhID = item.whID
        await item.update(req.body)

        // Si la cantidad cambió, deja rastro en el historial de ajustes — así la
        // pestaña "Historial de ajustes" del frontend muestra algo real en vez de
        // quedar siempre vacía.
        if (typeof req.body.quantity === 'number' && req.body.quantity !== previousQuantity) {
            await InventoryAdjustment.create({
                type: 'adjust',
                prodCode: item.prodCode,
                availableBefore: previousQuantity,
                outstandingDeliveryBefore: 0,
                quantityTransferred: item.quantity - previousQuantity,
                adjustmentDate: new Date(),
                description: typeof req.body.description === 'string' ? req.body.description : 'Ajuste manual de cantidad',
            })
        }

        // Si cambió de almacén, lo mismo pero en "Historial de transferencias".
        if (typeof req.body.whID === 'string' && req.body.whID !== previousWhID) {
            await InventoryAdjustment.create({
                type: 'transfer',
                prodCode: item.prodCode,
                sourceWarehousewhID: previousWhID,
                destinationWarehousewhID: item.whID,
                quantityTransferred: item.quantity,
                adjustmentDate: new Date(),
                description: 'Cambio de almacén',
            })
        }

        res.json(item)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// POST /inventories/transfer — mueve stock de un producto hacia OTRO almacén,
// a diferencia de updateInventory (que reasigna toda la fila). Dos modos:
//   'transfer'  -> resta `quantity` del almacén de origen (no puede exceder lo
//                  disponible ahí) y lo suma en el destino. Queda en
//                  "Historial de transferencias".
//   'ingresar'  -> suma `quantity` directo en el destino, sin tocar ningún
//                  origen (stock nuevo que entra, ej. recién comprado). Sin
//                  límite superior. Queda en "Historial de ajustes".
// sourceWhID puede venir vacío/null cuando el producto todavía no tiene
// ninguna fila de inventario (fila "virtual" en el frontend) — en ese caso
// solo 'ingresar' tiene sentido, ya que no hay nada que transferir.
export async function transferInventory(req: Request, res: Response) {
    try {
        const { prodCode, sourceWhID, destinationWhID, quantity, mode } = req.body

        if (!prodCode || !destinationWhID) {
            res.status(400).json({ message: 'prodCode y destinationWhID son obligatorios' })
            return
        }
        if (mode !== 'transfer' && mode !== 'ingresar') {
            res.status(400).json({ message: "mode debe ser 'transfer' o 'ingresar'" })
            return
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            res.status(400).json({ message: 'quantity debe ser un entero de 1 o más' })
            return
        }
        if (sourceWhID && sourceWhID === destinationWhID) {
            res.status(400).json({ message: 'El almacén de destino debe ser distinto al de origen' })
            return
        }

        let sourceItem: Inventory | null = null
        if (mode === 'transfer') {
            if (!sourceWhID) {
                res.status(400).json({ message: 'No hay almacén de origen del cual transferir' })
                return
            }
            sourceItem = await Inventory.findOne({ where: { prodCode, whID: sourceWhID } })
            if (!sourceItem || quantity > sourceItem.quantity) {
                res.status(400).json({ message: 'La cantidad excede el stock disponible en el almacén de origen' })
                return
            }
            await sourceItem.update({ quantity: sourceItem.quantity - quantity })
        }

        let destItem = await Inventory.findOne({ where: { prodCode, whID: destinationWhID } })
        const destBefore = destItem ? destItem.quantity : 0
        if (destItem) {
            await destItem.update({ quantity: destItem.quantity + quantity })
        } else {
            destItem = await Inventory.create({ prodCode, whID: destinationWhID, quantity })
        }

        if (mode === 'transfer') {
            await InventoryAdjustment.create({
                type: 'transfer',
                prodCode,
                sourceWarehousewhID: sourceWhID,
                destinationWarehousewhID: destinationWhID,
                quantityTransferred: quantity,
                adjustmentDate: new Date(),
                description: 'Transferencia entre almacenes',
            })
        } else {
            await InventoryAdjustment.create({
                type: 'adjust',
                prodCode,
                availableBefore: destBefore,
                outstandingDeliveryBefore: 0,
                quantityTransferred: quantity,
                adjustmentDate: new Date(),
                description: 'Ingreso de stock nuevo',
            })
        }

        res.json({ source: sourceItem, destination: destItem })
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteInventory(req: Request, res: Response) {
    try {
        const item = await Inventory.findByPk(req.params.inventoryID as string)
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
