// src/models/inventory.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Warehouse } from './warehouse.model.js';

@Table({ tableName: 'inventory', timestamps: false })
export class Inventory extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare inventoryID: string;

  @Column({ type: DataType.STRING(100) })
  declare inventoryName: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare quantity: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @BelongsTo(() => Product)
  declare product?: Product;

  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID })
  declare whID: string;

  @BelongsTo(() => Warehouse)
  declare warehouse?: Warehouse;

}
