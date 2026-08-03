// src/models/picture.model.ts
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Product } from './product.model.js';

@Table({ tableName: 'picture', timestamps: false })
export class Picture extends Model {
  @Default(DataType.UUIDV4)
  @PrimaryKey
  @Column({ type: DataType.UUID })
  declare pictureID: string;

  @Column({ type: DataType.STRING(150) })
  declare name: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare link: string;

  @Column({ type: DataType.DATE })
  declare createdAt: Date;

  @ForeignKey(() => Product)
  @Column({ type: DataType.UUID })
  declare prodCode: string;

  @BelongsTo(() => Product)
  declare product?: Product;

}
