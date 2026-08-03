// src/models/product.model.ts
import { BelongsTo, BelongsToMany, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Category } from './category.model.js';
import { Inventory } from './inventory.model.js';
import { InventoryAdjustment } from './inventoryAdjustment.model.js';
import { Picture } from './picture.model.js';
import { ProductUnit } from './productUnit.model.js';
import { Promo } from './promo.model.js';
import { SalesExpectation } from './salesExpectation.model.js';
import { SuppProd } from './suppProd.model.js';
import { Supplier } from './supplier.model.js';
import { TransDetail } from './transDetail.model.js';

@Table({ tableName: 'product', timestamps: false })
export class Product extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare productName: string;

  @Column({ type: DataType.STRING(20), allowNull: false, unique: true })
  declare sku: string;

  @Column({ type: DataType.TEXT })
  declare description: string;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['warehouse','custom']] } })
  declare prodType: string;

  @Column({ type: DataType.DECIMAL(10,2), defaultValue: 0 })
  declare cost: number;

  @Column({ type: DataType.STRING(3), defaultValue: 'MXN' })
  declare currencyCost: string;

  @Column({ type: DataType.DECIMAL(10,2), defaultValue: 0 })
  declare salePrice: number;

  @Column({ type: DataType.SMALLINT, defaultValue: 0 })
  declare lowStock: number;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @ForeignKey(() => Promo)
  @Column({ type: DataType.UUID, allowNull: true })
  declare discountID: string;
                                
  @BelongsTo(() => Promo)
  declare promo?: Promo;

  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, allowNull: true })
  declare categoryID: string;

  @BelongsTo(() => Category)
  declare category?: Category;

  @ForeignKey(() => ProductUnit)
  @Column({ type: DataType.UUID, allowNull: true })
  declare produnitID: string;

  @BelongsTo(() => ProductUnit)
  declare unit?: ProductUnit;

  @HasMany(() => Picture)
  declare pictures?: Picture[];

  @HasMany(() => SuppProd)
  declare suppProds?: SuppProd[];

  @HasMany(() => Inventory)
  declare inventories?: Inventory[];

  @HasMany(() => InventoryAdjustment)
  declare adjustments?: InventoryAdjustment[];

  @HasMany(() => TransDetail)
  declare transDetails?: TransDetail[];

  @HasMany(() => SalesExpectation)
  declare expectations?: SalesExpectation[];

  @BelongsToMany(() => Supplier, () => SuppProd)
  declare suppliers?: Supplier[];

}
