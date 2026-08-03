// src/models/courier.model.ts
import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { TransCourier } from './transCourier.model.js';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'courier', timestamps: false })
export class Courier extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare courierID: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare courierName: string;

  @HasMany(() => TransCourier)
  declare transCouriers?: TransCourier[];

  @BelongsToMany(() => Transaction, () => TransCourier)
  declare transactions?: Transaction[];

}
