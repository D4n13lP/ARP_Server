// src/models/transCourier.model.ts
import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Courier } from './courier.model.js';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'transCourier', timestamps: false })
export class TransCourier extends Model {
  @ForeignKey(() => Transaction)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @ForeignKey(() => Courier)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare courierID: string;

  @BelongsTo(() => Courier)
  declare courier?: Courier;

}
