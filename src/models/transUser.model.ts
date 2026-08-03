// src/models/transUser.model.ts
import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Transaction } from './transaction.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'transUser', timestamps: false })
export class TransUser extends Model {
  @Column({ type: DataType.DECIMAL(12,2), defaultValue: 0 })
  declare amountOnAccount: number;

  @ForeignKey(() => Transaction)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @ForeignKey(() => User)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare userID: string;

  @BelongsTo(() => User)
  declare user?: User;

}
