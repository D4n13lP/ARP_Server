// src/models/cash.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { TotalCash } from './totalCash.model.js';

@Table({ tableName: 'cash', timestamps: false })
export class Cash extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare cashID: string;

  @Column({ type: DataType.DECIMAL(12,2), defaultValue: 0 })
  declare cashAmount: number;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @ForeignKey(() => TotalCash)
  @Column({ type: DataType.UUID })
  declare totalCashID: string;

  @BelongsTo(() => TotalCash)
  declare totalCash?: TotalCash;

}
