// src/controllers/ticketConfig.controller.ts
import type { Request, Response } from 'express'
import { TicketConfig } from '../models/index.js'

// Mismo shape que el frontend (types/index.ts -> TicketConfigSchema) y los
// mismos textos que traía el ticket antes de que esto fuera editable — así
// la primera vez que alguien pide /ticket-config (todavía sin fila en la
// tabla) el ticket se ve exactamente igual que antes.
const DEFAULT_TICKET_CONFIG = {
    empresaNombre: 'Acabados Rústicos Pirámides',
    empresaDireccion: 'Carretera México-Tulancingo km 26+650, San Francisco Mazapa, Teotihuacán, Estado de México.',
    empresaTelefonos: '5581705740   5643337241',
    empresaCorreo: 'acabadosrusticospiramides@gmail.com',

    lblTicketCompra: 'Número de ticket de compra:',
    lblFecha: 'Fecha:',
    lblHora: 'Hora:',
    lblVendedor: 'Vendedor:',
    lblCliente: 'Nombre de cliente:',
    lblDomicilio: 'Domicilio:',
    lblFechaEntrega: 'Fecha de entrega:',
    lblCantidad: 'Cant.',
    lblDescripcion: 'Descripción',
    lblPrecio: 'Precio',
    lblImporte: 'Importe',
    lblSubtotal: 'Subtotal',
    lblDescuento: 'Descuento',
    lblCostoEnvio: 'Costo de envío',
    lblTotal: 'Total',
    lblAnticipo: 'Anticipo',
    lblRestante: 'Restante',
    lblTipoPago: 'Tipo de pago',
    lblEntregado: 'Entregado',
    lblCambio: 'Cambio',
    lblFirma: 'Firma de conformidad',
    lblGracias: '¡GRACIAS POR SU PREFERENCIA!',

    legalTitulo: 'NO ACEPTAMOS CAMBIOS NI DEVOLUCIONES',
    legalLinea1: '-Todas la piedras provienen de la naturaleza, por lo cual es de esperarse que tengas variaciones de tono, medida y peso, aun cuando sean parte de un mismo corte o lote y sean de primera calidad.',
    legalLinea2: '-El cliente acepta el 5% de merma por transporte y manejo.',
    legalLinea3: '-Salida la mercancía no se aceptan cambios ni devoluciones.',
    legalLinea4: '-Todas nuestras entregas son a pie de carro.',

    // Etiquetas de producto (botón "Imprimir etiqueta" en ProductModal) —
    // parámetros equivalentes a los de una etiquetadora física, editables
    // desde "Editar etiquetas" (misma pantalla que "Editar tickets").
    etiquetaTipoCodigo: 'CODE128',
    etiquetaMostrarSku: true,
    etiquetaFechaHora: false,
    etiquetaRotar: false,
    etiquetaVertical: false,
    etiquetaEspejo: false,
}

// GET /ticket-config — cualquier usuario autenticado (vendedor o admin): lo
// necesitan todos para imprimir el ticket, no solo quien lo edita.
export async function getTicketConfig(req: Request, res: Response) {
    try {
        const [row] = await TicketConfig.findOrCreate({
            where: { ticketConfigID: 'default' },
            defaults: { configData: DEFAULT_TICKET_CONFIG },
        })
        // El spread de DEFAULT_TICKET_CONFIG primero cubre cualquier campo
        // nuevo que se agregue después y que una fila vieja todavía no tenga.
        res.json({ ...DEFAULT_TICKET_CONFIG, ...(row.configData as object) })
    } catch (error: any) {
        res.status(500).json({ message: error.message })
    }
}

// PUT /ticket-config — protegido con authorizeRoles('admin') en las rutas.
export async function updateTicketConfig(req: Request, res: Response) {
    try {
        const [row] = await TicketConfig.findOrCreate({
            where: { ticketConfigID: 'default' },
            defaults: { configData: DEFAULT_TICKET_CONFIG },
        })
        const merged = { ...DEFAULT_TICKET_CONFIG, ...(row.configData as object), ...req.body }
        await row.update({ configData: merged })
        res.json(merged)
    } catch (error: any) {
        res.status(400).json({ message: error.message })
    }
}
