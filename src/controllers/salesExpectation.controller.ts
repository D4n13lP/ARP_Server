// src/controllers/salesExpectation.controller.ts
import type { Request, Response } from 'express'
import { SalesExpectation, TimeUnit } from '../models/index.js'
import { getSoldQuantityInRange } from '../utils/salesExpectationProgress.js'
import { toBusinessDateOnly, addDaysToDateOnly, addMonthsToDateOnly } from '../utils/businessTime.js'

// Suma periodLength unidades de tiempo (según el nombre del TimeUnit) a
// startDate ("YYYY-MM-DD"). "días"/"semanas"/"meses" son las 3 únicas
// opciones que ofrece el frontend (AddProduct_Page y ProductModal) —
// cualquier otro nombre cae al caso de "días" por seguridad. Aritmética de
// calendario pura (ver businessTime.ts) — antes se hacía sobre un objeto
// Date con setUTCDate/setUTCMonth, lo que podía adelantar startDate un día
// completo respecto a la hora real de México al crear/editar la expectativa
// entre las 18:00 y las 23:59 hora local.
function addPeriodToDateOnly(dateStr: string, periodLength: number, timeUnitName: string | undefined): string {
    if (timeUnitName === 'semanas') return addDaysToDateOnly(dateStr, periodLength * 7)
    if (timeUnitName === 'meses') return addMonthsToDateOnly(dateStr, periodLength)
    return addDaysToDateOnly(dateStr, periodLength)
}

// Agrega al JSON de la fila cuánto se ha vendido realmente del producto
// dentro de su plazo (startDate–endDate) y si ya se cumplió la expectativa.
// Solo cuentan transacciones "completed" (una venta queda completed al
// instante; un pedido hasta que se entrega — ver transaction.controller.ts),
// para no contar como vendido algo que sigue pendiente de entregar.
async function withProgress(item: SalesExpectation) {
    const soldQuantity = await getSoldQuantityInRange(item.prodCode, item.startDate, item.endDate)
    const json = item.toJSON() as Record<string, unknown>
    json.soldQuantity = soldQuantity
    json.fulfilled = soldQuantity >= item.quantity
    json.periodEnded = toBusinessDateOnly() > item.endDate
    return json
}

export async function createSalesExpectation(req: Request, res: Response) {
    try {
        const { prodCode, timeunitID, quantity, periodLength } = req.body
        const length = Number(periodLength) > 0 ? Math.round(Number(periodLength)) : 1

        const timeUnit = await TimeUnit.findByPk(timeunitID)
        if (!timeUnit) {
            res.status(400).json({ message: 'timeunitID no corresponde a una unidad de tiempo válida' })
            return
        }

        const startDate = toBusinessDateOnly()
        const endDate = addPeriodToDateOnly(startDate, length, timeUnit.timeunitName)

        const item = await SalesExpectation.create({
            prodCode,
            timeunitID,
            quantity,
            periodLength: length,
            startDate,
            endDate,
        })
        await item.reload({ include: [TimeUnit] })
        res.status(201).json(await withProgress(item))
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

// GET /sales-expectations?prodCode=... — sin prodCode regresa todas (uso
// admin); ProductModal siempre filtra por el producto que tiene abierto.
export async function getSalesExpectations(req: Request, res: Response) {
    try {
        const where: Record<string, unknown> = {}
        if (req.query.prodCode) {
            where.prodCode = req.query.prodCode
        }
        const items = await SalesExpectation.findAll({ where, include: [TimeUnit] })
        res.json(await Promise.all(items.map(withProgress)))
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function getSalesExpectationById(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.findByPk(req.params.expectationID as string, { include: [TimeUnit] })
        if (!item) {
            res.status(404).json({ message: 'SalesExpectation no encontrado' })
            return
        }
        res.json(await withProgress(item))
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

export async function updateSalesExpectation(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.findByPk(req.params.expectationID as string)
        if (!item) {
            res.status(404).json({ message: 'SalesExpectation no encontrado' })
            return
        }

        const { quantity, timeunitID, periodLength } = req.body
        const updates: Record<string, unknown> = {}
        if (typeof quantity === 'number') updates.quantity = quantity
        if (typeof timeunitID === 'string') updates.timeunitID = timeunitID
        if (typeof periodLength === 'number' && periodLength > 0) updates.periodLength = Math.round(periodLength)

        // Si cambia la unidad o la duración, se recalcula endDate a partir del
        // startDate YA GUARDADO (no de "ahora") — editar el plazo ajusta hasta
        // cuándo corre, pero no reinicia el reloj.
        if (updates.timeunitID || updates.periodLength) {
            const timeunitIDToUse = (updates.timeunitID as string) || item.timeunitID
            const timeUnit = await TimeUnit.findByPk(timeunitIDToUse)
            const lengthToUse = (updates.periodLength as number) || item.periodLength
            updates.endDate = addPeriodToDateOnly(item.startDate, lengthToUse, timeUnit?.timeunitName)
        }

        await item.update(updates)
        await item.reload({ include: [TimeUnit] })
        res.json(await withProgress(item))
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}

export async function deleteSalesExpectation(req: Request, res: Response) {
    try {
        const item = await SalesExpectation.findByPk(req.params.expectationID as string)
        if (!item) {
            res.status(404).json({ message: 'SalesExpectation no encontrado' })
            return
        }
        await item.destroy()
        res.status(204).send()
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}
