// src/models/transDestAcc.model.ts
import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { DestAccount } from './destAccount.model.js';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'transDestAcc', timestamps: false })
export class TransDestAcc extends Model {
  @ForeignKey(() => Transaction)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @ForeignKey(() => DestAccount)
  @PrimaryKey
  @Column({ type: DataType.CHAR(18) })
  declare clabe: string;

  @BelongsTo(() => DestAccount)
  declare destAccount?: DestAccount;

}
