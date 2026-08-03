// src/models/destAccount.model.ts
import { BelongsToMany, Column, DataType, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { PaymentHistory } from './paymentHistory.model.js';
import { TransDestAcc } from './transDestAcc.model.js';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'destAccount', timestamps: false })
export class DestAccount extends Model {
  @PrimaryKey
  @Column({ type: DataType.CHAR(18) })
  declare clabe: string;

  @Column({ type: DataType.STRING(30) })
  declare accountNumber: string;

  @Column({ type: DataType.STRING(100) })
  declare accountAlias: string;

  @Column({ type: DataType.STRING(150) })
  declare holderName: string;

  @Column({ type: DataType.STRING(100) })
  declare bank: string;

  @HasMany(() => TransDestAcc)
  declare transactionLinks?: TransDestAcc[];

  @HasMany(() => PaymentHistory)
  declare payments?: PaymentHistory[];

  @BelongsToMany(() => Transaction, () => TransDestAcc)
  declare transactions?: Transaction[];

}
