// src/models/userPermission.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { User } from './user.model.js';
import { Module } from './module.model.js';

// Permisos por persona individual (a diferencia de rolePermission, que es la
// plantilla por tipo de cuenta usada solo al crear el usuario). Ver
// contextoMD/migracion_permisos_individuales.sql.
@Table({ tableName: 'userPermission', timestamps: false })
export class UserPermission extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare userPermissionID: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userID: string;

  @BelongsTo(() => User)
  declare user?: User;

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
