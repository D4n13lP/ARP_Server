// src/models/timeUnit.model.ts
import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { SalesExpectation } from './salesExpectation.model.js';

@Table({ tableName: 'timeUnit', timestamps: false })
export class TimeUnit extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare timeunitID: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare timeunitName: string;

  @HasMany(() => SalesExpectation)
  declare expectations?: SalesExpectation[];

}
