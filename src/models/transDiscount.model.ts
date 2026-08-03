// src/models/transDiscount.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { TransDetail } from './transDetail.model.js';

@Table({ tableName: 'transDiscount', timestamps: false })
export class TransDiscount extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare transDiscountID: string;

  @Column({ type: DataType.DECIMAL(5,4), allowNull: false })
  declare percent: number;

  @Column({ type: DataType.STRING(2), allowNull: false, validate: { isIn: [['t1','t2']] } })
  declare type: string;

  @HasMany(() => TransDetail)
  declare transDetails?: TransDetail[];

}
