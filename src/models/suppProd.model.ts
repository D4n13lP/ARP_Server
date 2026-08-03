// src/models/suppProd.model.ts
import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Supplier } from './supplier.model.js';

@Table({ tableName: 'suppProd', timestamps: false })
export class SuppProd extends Model {
  @ForeignKey(() => Supplier)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare suppCode: string;

  @BelongsTo(() => Supplier)
  declare supplier?: Supplier;

  @ForeignKey(() => Product)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @BelongsTo(() => Product)
  declare product?: Product;

}
