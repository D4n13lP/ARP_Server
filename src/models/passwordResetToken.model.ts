// src/models/passwordResetToken.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { User } from './user.model.js';

@Table({ tableName: 'passwordResetToken', timestamps: false })
export class PasswordResetToken extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare resetTokenID: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userID: string;

  @BelongsTo(() => User)
  declare user?: User;

  // Hash SHA-256 del token; el token en texto plano nunca se guarda en la base.
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare tokenHash: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isUsed: boolean;

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, allowNull: false })
  declare createdAt: Date;

}
