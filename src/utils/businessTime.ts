// src/utils/businessTime.ts
// El negocio opera en horario de México central (America/Mexico_City) pero
// tanto el proceso de Node como la sesión de Postgres en Render corren en
// UTC. Cualquier "hoy" calculado con new Date().toISOString().slice(0,10) (o
// cualquier otro método basado en UTC: getUTCFullYear, Date.now(), etc.) se
// adelanta hasta 6 horas — un día calendario completo — respecto a la hora
// real del negocio, entre las 18:00 y las 23:59 hora local. Esa es la misma
// zona que ya usan ProductModal.tsx/TicketPrintModal en el frontend para
// mostrar fecha/hora al imprimir — aquí es el equivalente para el backend.
const BUSINESS_TIMEZONE = 'America/Mexico_City'

// "YYYY-MM-DD" de una fecha/hora en la zona del negocio (por default, "ahora").
// OJO: solo para columnas DATEONLY (transactionDate, deliveryDate,
// salesExpectation.startDate/endDate) — las columnas "timestamp without time
// zone" de este proyecto (paymentDate, adjustmentDate, withdrawalDate) se
// siguen guardando como instante real en UTC (new Date() normal), porque el
// frontend (formatDateTimeMX, OrderDetail_Page) ya las convierte a hora de
// México solo al mostrarlas — no agregues aquí un "businessNowTimestamp()"
// que las guarde ya en hora local, se verían corridas dos veces.
export function toBusinessDateOnly(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIMEZONE }).format(date)
}

// --- Aritmética de calendario pura sobre strings "YYYY-MM-DD" ---
// Todas anclan con Date.UTC solo como truco interno para sumar/restar
// enteros de año/mes/día; nunca se leen instantes reales de estas fechas, así
// que no hay contaminación de ninguna zona horaria real.

function parseDateOnly(dateStr: string): [number, number, number] {
    const [y, m, d] = dateStr.split('-').map(Number)
    return [y, m, d]
}

export function addDaysToDateOnly(dateStr: string, days: number): string {
    const [y, m, d] = parseDateOnly(dateStr)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + days)
    return dt.toISOString().slice(0, 10)
}

export function addMonthsToDateOnly(dateStr: string, months: number): string {
    const [y, m, d] = parseDateOnly(dateStr)
    const dt = new Date(Date.UTC(y, m - 1 + months, d))
    return dt.toISOString().slice(0, 10)
}

// Diferencia en días completos: toStr - fromStr (positivo si toStr es
// posterior a fromStr).
export function daysBetweenDateOnly(fromStr: string, toStr: string): number {
    const [fy, fm, fd] = parseDateOnly(fromStr)
    const [ty, tm, td] = parseDateOnly(toStr)
    const fromMs = Date.UTC(fy, fm - 1, fd)
    const toMs = Date.UTC(ty, tm - 1, td)
    return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24))
}
