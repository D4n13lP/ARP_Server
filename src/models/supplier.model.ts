// src/models/supplier.model.ts
import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { SuppProd } from './suppProd.model.js';

@Table({ tableName: 'supplier', timestamps: false })
export class Supplier extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare suppCode: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare supplierName: string;

  @Column({ type: DataType.STRING(150) })
  declare enterpBusi: string;

  @Column({ type: DataType.STRING(255) })
  declare address: string;

  @Column({ type: DataType.STRING(20) })
  declare officePhone: string;

  @Column({ type: DataType.STRING(100) })
  declare contactName: string;

  @Column({ type: DataType.STRING(20) })
  declare contactPhone: string;

  @Column({ type: DataType.STRING(150) })
  declare email: string;

  @Column({ type: DataType.STRING(255) })
  declare website: string;

  @HasMany(() => SuppProd)
  declare suppProds?: SuppProd[];

  @BelongsToMany(() => Product, () => SuppProd)
  declare products?: Product[];

}
