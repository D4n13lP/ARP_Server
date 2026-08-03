// src/models/transaction.model.ts
import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Client } from './client.model.js';
import { Courier } from './courier.model.js';
import { DestAccount } from './destAccount.model.js';
import { PaymentHistory } from './paymentHistory.model.js';
import { TransCourier } from './transCourier.model.js';
import { TransDestAcc } from './transDestAcc.model.js';
import { TransDetail } from './transDetail.model.js';
import { TransUser } from './transUser.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'transaction', timestamps: false })
export class Transaction extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['sale','order']] } })
  declare transType: string;

  @Column({ type: DataType.SMALLINT })
  declare folioYear: number;

  @Column({ type: DataType.SMALLINT })
  declare folioMonth: number;

  @Column({ type: DataType.INTEGER })
  declare folioNumber: number;

  @Column({ type: DataType.STRING(8) })
  declare folio: string;

  @Column({ type: DataType.DATEONLY })
  declare transactionDate: string;

  @Column({ type: DataType.DATEONLY })
  declare deliveryDate: string;

  @Column({ type: DataType.DATEONLY })
  declare dispatchDateI: string;

  @Column({ type: DataType.DATEONLY })
  declare dispatchDateF: string;

  @Column({ type: DataType.STRING(10), defaultValue: 'pending', validate: { isIn: [['pending','completed']] } })
  declare status: string;

  @Column({ type: DataType.DECIMAL(12,2), defaultValue: 0 })
  declare finalAmount: number;

  @Column({ type: DataType.DECIMAL(12,2), defaultValue: 0 })
  declare outstandingAmount: number;

  @Column({ type: DataType.STRING(255) })
  declare deliveryLocation: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  declare clientCode: string;

  @BelongsTo(() => Client)
  declare client?: Client;

  @HasMany(() => TransDetail)
  declare details?: TransDetail[];

  @HasMany(() => TransDestAcc)
  declare destAccountLinks?: TransDestAcc[];

  @HasMany(() => TransUser)
  declare transUsers?: TransUser[];

  @HasMany(() => TransCourier)
  declare transCouriers?: TransCourier[];

  @HasMany(() => PaymentHistory)
  declare payments?: PaymentHistory[];

  @BelongsToMany(() => DestAccount, () => TransDestAcc)
  declare destAccounts?: DestAccount[];

  @BelongsToMany(() => User, () => TransUser)
  declare users?: User[];

  @BelongsToMany(() => Courier, () => TransCourier)
  declare couriers?: Courier[];

}
