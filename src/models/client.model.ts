// src/models/client.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Transaction } from './transaction.model.js';

@Table({ tableName: 'client', timestamps: false })
export class Client extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare clientCode: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare clientName: string;

  @Column({ type: DataType.STRING(20) })
  declare clientPhone1: string;

  @Column({ type: DataType.STRING(20) })
  declare clientPhone2: string;

  @Column({ type: DataType.STRING(255) })
  declare address: string;

  @Column({ type: DataType.STRING(13) })
  declare RFC: string;

  @Column({ type: DataType.STRING(150) })
  declare email: string;

  @Column({ type: DataType.DECIMAL(5,4), defaultValue: 0 })
  declare discountPercentage: number;

  @HasMany(() => Transaction)
  declare transactions?: Transaction[];

}
