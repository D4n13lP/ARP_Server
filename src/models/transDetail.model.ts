// src/models/transDetail.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';
import { TransDiscount } from './transDiscount.model.js';
import { Transaction } from './transaction.model.js';
import { Warehouse } from './warehouse.model.js';

@Table({ tableName: 'transDetail', timestamps: false })
export class TransDetail extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare transDetailID: string;

  @Column({ type: DataType.SMALLINT, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(10,2), allowNull: false })
  declare unitPrice: number;

  @Column({ type: DataType.DECIMAL(12,2), allowNull: false })
  declare subtotal: number;

  @Column({ type: DataType.DECIMAL(5,4), defaultValue: 0 })
  declare appliedDisc: number;

  @ForeignKey(() => Transaction)
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @BelongsTo(() => Product)
  declare product?: Product;

  @ForeignKey(() => TransDiscount)
  @Column({ type: DataType.UUID, allowNull: true })
  declare transDiscountID: string;

  @BelongsTo(() => TransDiscount)
  declare discount?: TransDiscount;

  // De qué almacén se descontó este renglón al vender/pedir (ver
  // processTransaction en transaction.controller.ts) — nulo en renglones
  // históricos de antes de esta columna. Lo usa Inventory.tsx para atribuir
  // "Pendiente entrega" al almacén correcto en vez de duplicarlo en todos
  // los almacenes donde existe el producto.
  @ForeignKey(() => Warehouse)
  @Column({ type: DataType.UUID, allowNull: true })
  declare whID: string;

  @BelongsTo(() => Warehouse)
  declare warehouse?: Warehouse;

}
