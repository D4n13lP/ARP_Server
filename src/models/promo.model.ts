// src/models/promo.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Category } from './category.model.js';
import { Product } from './product.model.js';

@Table({ tableName: 'promo', timestamps: false })
export class Promo extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare discountID: string;

  @Column({ type: DataType.DECIMAL(5,4), allowNull: false })
  declare discountPercentage: number;

  @HasMany(() => Category)
  declare categories?: Category[];

  @HasMany(() => Product)
  declare products?: Product[];

}
