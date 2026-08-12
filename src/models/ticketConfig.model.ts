// src/models/ticketConfig.model.ts
import { Column, DataType, Default, Model, PrimaryKey, Table } from 'sequelize-typescript';

// Fila única (ticketConfigID siempre 'default') con los textos editables del
// ticket impreso (Editar Ticket y etiquetas, solo admin) — nombre/dirección de
// la empresa, etiquetas de cada campo y textos legales. Todo va en un solo
// JSONB para no tener que migrar la tabla cada vez que se agregue un campo
// nuevo al formulario; el shape completo vive en ticketConfig.controller.ts
// (DEFAULT_TICKET_CONFIG) y en el frontend (types/index.ts).
@Table({ tableName: 'ticketConfig', timestamps: false })
export class TicketConfig extends Model {
  @Default('default')
  @PrimaryKey
  @Column({ type: DataType.STRING(20) })
  declare ticketConfigID: string;

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: {} })
  declare configData: object;
}
