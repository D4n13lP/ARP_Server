// src/models/productUnit.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';

@Table({ tableName: 'productUnit', timestamps: false })
export class ProductUnit extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare produnitID: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare produnitName: string;

  @HasMany(() => Product)
  declare products?: Product[];

}
