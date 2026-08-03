// src/models/category.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Promo } from './promo.model.js';

@Table({ tableName: 'category', timestamps: false })
export class Category extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare categoryID: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare categoryName: string;

  @ForeignKey(() => Promo)
  @Column({ type: DataType.UUID, allowNull: true })
  declare discountID: string;

  @BelongsTo(() => Promo)
  declare promo?: Promo;

  @HasMany(() => Product)
  declare products?: Product[];

}
