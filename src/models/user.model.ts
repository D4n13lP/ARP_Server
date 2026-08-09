// src/models/user.model.ts
import { BelongsToMany, Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { TotalCash } from './totalCash.model.js';
import { TransUser } from './transUser.model.js';
import { Transaction } from './transaction.model.js';
import { EmailVerificationToken } from './emailVerificationToken.model.js';
import { PasswordResetToken } from './passwordResetToken.model.js';
import { UserPermission } from './userPermission.model.js';

@Table({ tableName: 'user', timestamps: false })
export class User extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare userID: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare userName: string;

  @Column({ type: DataType.STRING(150), allowNull: false, unique: true })
  declare email: string;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['admin','seller']] } })
  declare userType: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  declare isActive: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isEmailVerified: boolean;

  @Column({ type: DataType.STRING(150), allowNull: true, unique: true })
  declare recoveryEmail: string | null;

  // Identificador corto y memorizable, solo de referencia (gafete, decirlo de
  // palabra). No es la llave primaria: userID (UUID) sigue siendo la que usan
  // transUser, totalCash y las tablas de tokens. Lo genera el backend solo.
  @Column({ type: DataType.STRING(9), allowNull: false, unique: true })
  declare employeeCode: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare phone: string | null;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @Column({ type: DataType.DATE })
  declare updatedAt: Date;

  @Column({ type: DataType.DATE })
  declare lastLogin: Date;

  @HasMany(() => TransUser)
  declare transUsers?: TransUser[];

  @HasMany(() => TotalCash)
  declare ownedCash?: TotalCash[];

  @HasMany(() => TotalCash)
  declare adminCash?: TotalCash[];

  @BelongsToMany(() => Transaction, () => TransUser)
  declare transactions?: Transaction[];

  @HasMany(() => EmailVerificationToken)
  declare emailVerificationTokens?: EmailVerificationToken[];

  @HasMany(() => PasswordResetToken)
  declare passwordResetTokens?: PasswordResetToken[];

  @HasMany(() => UserPermission)
  declare userPermissions?: UserPermission[];

}
