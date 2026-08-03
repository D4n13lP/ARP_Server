// src/models/paymentHistory.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { DestAccount } from './destAccount.model.js';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'paymentHistory', timestamps: false })
export class PaymentHistory extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare pymntHistryID: string;

  @Column({ type: DataType.DECIMAL(12,2), allowNull: false })
  declare paymentAmount: number;

  @Column({ type: DataType.DATE })
  declare paymentDate: Date;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['cash','digital']] } })
  declare paymentMethod: string;

  @ForeignKey(() => Transaction)
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @ForeignKey(() => DestAccount)
  @Column({ type: DataType.CHAR(18), allowNull: true })
  declare clabe: string;

  @BelongsTo(() => DestAccount)
  declare destAccount?: DestAccount;

}
