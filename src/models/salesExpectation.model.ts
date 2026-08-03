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

}
