// src/controllers/inventory.controller.ts
import type { Request, Response } from 'express'
import { Inventory, Product, Warehouse, Category, ProductUnit, Picture, Promo, InventoryAdjustment, TransDetail } from '../models/index.js'

// El almacén fijo "Pedido especial" (ver warehouse.model.ts) solo puede
// recibir stock a través del flujo de Orden Especial (createSpecialOrderProduct
// en product.controller.ts, que crea el Inventory directo con el modelo, sin
// pasar por este controller) — cualquier otra vía queda bloqueada aquí.
// Se checa por bandera Y por nombre exacto: blindaje extra por si existiera
// una fila con ese nombre creada antes de tener la columna isSpecialOrders
// (o duplicada a mano), que si no quedaría desprotegida.
const SPECIAL_ORDER_WAREHOUSE_NAME = 'Pedido especial'
async function isSpecialOrdersWarehouse(whID: unknown): Promise<boolean> {
    if (typeof whID !== 'string' || !whID) return false
    const wh = await Warehouse.findByPk(whID)
    if (!wh) return false
    return !!wh.isSpecialOrders || wh.whname === SPECIAL_ORDER_WAREHOUSE_NAME
}

export async function createInventory(req: Request, res: Response) {
    try {
        if (await isSpecialOrdersWarehouse(req.body.whID)) {
            res.status(400).json({ message: 'No se puede ingresar productos manualmente al almacén de Pedidos especiales.' })
            return
        }
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

        if (typeof req.body.whID === 'string' && req.body.whID !== previousWhID && await isSpecialOrdersWarehouse(req.body.whID)) {
            res.status(400).json({ message: 'No se puede mover productos manualmente al almacén de Pedidos especiales.' })
            return
        }

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
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
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
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
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
        // Ni transferir ni ingresar stock nuevo pueden apuntar al almacén de
        // Pedidos especiales — solo el flujo de Orden Especial puede llenarlo.
        if (await isSpecialOrdersWarehouse(destinationWhID)) {
            res.status(400).json({ message: 'No se puede transferir ni ingresar stock manualmente al almacén de Pedidos especiales.' })
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
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
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
                // Instante real en UTC a propósito (igual que paymentDate en
                // transaction.controller.ts) — el frontend (formatDateTimeMX)
                // ya lo convierte a hora de México solo al mostrarlo.
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
        const item = await Inventory.findByPk(req.params.inventoryID as string, { include: [Product] })
        if (!item) {
            res.status(404).json({ message: 'Inventory no encontrado' })
            return
        }
        const prodCode = item.prodCode
        const isCustom = item.product?.prodType === 'custom'
        await item.destroy()

        // Los productos armados al vuelo desde "Orden Especial" (prodType
        // 'custom') son de un solo uso: si este era su único registro de
        // inventario Y nunca llegaron a venderse/pedirse de verdad (sin
        // renglones en transDetail, que sí romperían el historial de una
        // transacción real), no tiene sentido dejar el producto huérfano.
        if (isCustom) {
            const [remainingInventory, usedInTransactions] = await Promise.all([
                Inventory.count({ where: { prodCode } }),
                TransDetail.count({ where: { prodCode } }),
            ])
            if (remainingInventory === 0 && usedInTransactions === 0) {
                await Product.destroy({ where: { prodCode } })
            }
        }

        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
