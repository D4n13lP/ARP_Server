// src/models/paymentHistory.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { DestAccount } from './destAccount.model.js';
import { Transaction } from './transaction.model.js';
import { User } from './user.model.js';

@Table({ tableName: 'paymentHistory', timestamps: false })
export class PaymentHistory extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare pymntHistryID: string;

  @Column({ type: DataType.DECIMAL(12,2), allowNull: false })
  declare paymentAmount: number;

  @Column({ type: DataType.DATE })
  declare paymentDate: Date;

  @Column({ type: DataType.STRING(10), allowNull: false, validate: { isIn: [['cash','digital']] } })
  declare paymentMethod: string;

  @ForeignKey(() => Transaction)
  @Column({ type: DataType.UUID })
  declare transactionID: string;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  @ForeignKey(() => DestAccount)
  @Column({ type: DataType.CHAR(18), allowNull: true })
  declare clabe: string;

  @BelongsTo(() => DestAccount)
  declare destAccount?: DestAccount;

  // Quién tenía la sesión abierta al registrar este pago/abono ("Cobró" en
  // OrderDetail_Page) — nulo en pagos históricos de antes de esta columna.
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare collectedByUserID: string;

  @BelongsTo(() => User, { foreignKey: 'collectedByUserID', as: 'collectedBy' })
  declare collectedBy?: User;

}
