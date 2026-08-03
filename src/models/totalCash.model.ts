// src/models/totalCash.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Cash } from './cash.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'totalCash', timestamps: false })
export class TotalCash extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare totalCashID: string;

  @Column({ type: DataType.DECIMAL(12,2), defaultValue: 0 })
  declare withdrawalAmount: number;

  @Column({ type: DataType.DATE })
  declare withdrawalDate: Date;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID })
  declare ownUserID: string;

  @BelongsTo(() => User)
  declare ownerUser?: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID })
  declare adminUserID: string;

  @BelongsTo(() => User)
  declare adminUser?: User;

  @HasMany(() => Cash)
  declare cashMovements?: Cash[];

}
