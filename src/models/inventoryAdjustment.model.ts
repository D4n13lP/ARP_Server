// src/models/inventoryAdjustment.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { Warehouse } from './warehouse.model.js';

@Table({ tableName: 'inventoryAdjustment', timestamps: false })
export class InventoryAdjustment extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare adjustID: string;

  @Column({ type: DataType.DATE })
  declare adjustmentDate: Date;

  @Column({ type: DataType.STRING(255) })
  declare description: string;

  @Column({ type: DataType.INTEGER })
  declare availableBefore: number;

  @Column({ type: DataType.INTEGER })
  declare outstandingDeliveryBefore: number;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['adjust','transfer']] } })
  declare type: string;

  @Column({ type: DataType.INTEGER })
  declare quantityTransferred: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @BelongsTo(() => Product)
  declare product?: Product;

  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, allowNull: true })
  declare sourceWarehousewhID: string;

  // Dos FKs distintas apuntan al mismo modelo (Warehouse) — sin foreignKey
  // explícito aquí, sequelize-typescript no las distingue bien al resolver el
  // include y las dos terminan devolviendo el mismo almacén (el de origen).
  @BelongsTo(() => Warehouse, { foreignKey: 'sourceWarehousewhID', as: 'sourceWarehouse' })
  declare sourceWarehouse?: Warehouse;

  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, allowNull: true })
  declare destinationWarehousewhID: string;

  @BelongsTo(() => Warehouse, { foreignKey: 'destinationWarehousewhID', as: 'destinationWarehouse' })
  declare destinationWarehouse?: Warehouse;

}
