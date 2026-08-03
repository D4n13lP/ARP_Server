// src/models/warehouse.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Inventory } from './inventory.model.js';
import { InventoryAdjustment } from './inventoryAdjustment.model.js';

@Table({ tableName: 'Warehouse', timestamps: false })
export class Warehouse extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare whID: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare whname: string;

  @Column({ type: DataType.STRING(255) })
  declare whaddress: string;

  @HasMany(() => Inventory)
  declare inventories?: Inventory[];

  @HasMany(() => InventoryAdjustment)
  declare adjustmentsAsSource?: InventoryAdjustment[];

  @HasMany(() => InventoryAdjustment)
  declare adjustmentsAsDestination?: InventoryAdjustment[];

}
