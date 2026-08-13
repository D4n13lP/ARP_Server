// src/utils/salesExpectationProgress.ts
// Compartido entre salesExpectation.controller.ts (progreso al ver/editar una
// expectativa) y dashboard.controller.ts (tabla de "Productos Rezagados") —
// un solo lugar para la regla de qué cuenta como "vendido": solo
// transacciones "completed" (una venta queda completed al instante; un
// pedido hasta que se entrega), dentro del rango de fechas dado.
import { QueryTypes } from 'sequelize'
import db from '../config/db.js'

export async function getSoldQuantityInRange(prodCode: string, startDate: string, endDate: string): Promise<number> {
    const [row] = await db.query<{ sold: string }>(
        `SELECT COALESCE(SUM(td."quantity"), 0) AS sold
         FROM "transDetail" td
         JOIN "transaction" t ON t."transactionID" = td."transactionID"
         WHERE td."prodCode" = :prodCode
           AND t."status" = 'completed'
           AND t."transactionDate" BETWEEN :startDate AND :endDate`,
        {
            replacements: { prodCode, startDate, endDate },
            type: QueryTypes.SELECT,
        },
    )
    return Number(row?.sold) || 0
}
