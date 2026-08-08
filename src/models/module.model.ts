// src/models/module.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { RolePermission } from './rolePermission.model.js';

@Table({ tableName: 'module', timestamps: false })
export class Module extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare moduleID: string;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  declare moduleKey: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare moduleName: string;

  @HasMany(() => RolePermission)
  declare rolePermissions?: RolePermission[];

}
