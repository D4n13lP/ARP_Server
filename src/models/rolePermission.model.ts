// src/models/rolePermission.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Module } from './module.model.js';

@Table({ tableName: 'rolePermission', timestamps: false })
export class RolePermission extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare permissionID: string;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['admin', 'seller']] } })
  declare userType: string;

  @ForeignKey(() => Module)
  @Column({ type: DataType.UUID, allowNull: false })
  declare moduleID: string;

  @BelongsTo(() => Module)
  declare module?: Module;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare canView: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare canCreate: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare canEdit: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare canDelete: boolean;

}
