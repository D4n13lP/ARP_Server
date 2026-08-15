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

  // Almacén donde ocurrió un ajuste (type='adjust': edición manual de
  // cantidad o "Ingreso de stock nuevo") — columna aparte de
  // sourceWarehousewhID/destinationWarehousewhID a propósito: la BD tiene un
  // CHECK ("inventoryAdjustment_check") que exige que esos dos campos queden
  // en NULL cuando type='adjust' (son exclusivos de type='transfer', donde sí
  // se exige que ambos estén llenos). Reutilizarlos para 'adjust' viola ese
  // CHECK y tumba el INSERT completo.
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, allowNull: true })
  declare whID: string;

  @BelongsTo(() => Warehouse, { foreignKey: 'whID', as: 'warehouse' })
  declare warehouse?: Warehouse;

}
