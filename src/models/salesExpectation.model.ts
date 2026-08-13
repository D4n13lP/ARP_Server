// src/models/salesExpectation.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { TimeUnit } from './timeUnit.model.js';

@Table({ tableName: 'salesExpectation', timestamps: false })
export class SalesExpectation extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare expectationID: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare quantity: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @BelongsTo(() => Product)
  declare product?: Product;

  @ForeignKey(() => TimeUnit)
  @Column({ type: DataType.UUID })
  declare timeunitID: string;

  @BelongsTo(() => TimeUnit)
  declare timeUnit?: TimeUnit;

  // Cuántas unidades de "timeUnit" dura el plazo (p. ej. periodLength=3 +
  // timeUnit="días" = "cada 3 días"). Antes existía un input para esto en
  // SalesPriceForm (cantTiempo) pero nunca se guardaba, se quedaba solo en
  // el estado local del formulario — sin esto no hay forma de saber cuánto
  // dura el plazo, solo el nombre genérico de la unidad.
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare periodLength: number;

  // Ancla fija del plazo: se calculan UNA vez al crear (o al editar
  // cantidad/unidad/duración) en vez de recalcularse cada vez que se
  // consulta — así "¿se cumplió en el tiempo establecido?" tiene una
  // respuesta estable en vez de una ventana móvil que se sigue corriendo
  // mientras el producto siga vendiéndose (ver salesExpectation.controller.ts).
  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare endDate: string;

}
