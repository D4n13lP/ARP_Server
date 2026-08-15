// src/models/clientProductDiscount.model.ts
// Descuento de un cliente puntual sobre UN producto puntual — a diferencia
// de Client.discountPercentage (un solo % global que, se confirmó, nunca se
// aplicaba en ninguna venta/pedido real: no lo leía ni el frontend de
// checkout ni processTransaction en el backend), esta tabla sí se consulta
// en processTransaction (transaction.controller.ts) al calcular el
// descuento de cada renglón, y tiene prioridad sobre la promoción del
// producto/categoría o el descuento tipo 1/2 elegido a mano.
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Client } from './client.model.js';
import { Product } from './product.model.js';

@Table({
    tableName: 'clientProductDiscount',
    timestamps: false,
    // Un solo descuento vigente por combinación cliente+producto — evita
    // filas duplicadas/ambiguas para el mismo par.
    indexes: [{ unique: true, fields: ['clientCode', 'prodCode'] }],
})
export class ClientProductDiscount extends Model {
    @Default(DataType.UUIDV4)
    @PrimaryKey
    @Column({ type: DataType.UUID })
    declare clientProductDiscountID: string;

    @ForeignKey(() => Client)
    @Column({ type: DataType.UUID, allowNull: false })
    declare clientCode: string;

    @BelongsTo(() => Client)
    declare client?: Client;

    @ForeignKey(() => Product)
    @Column({ type: DataType.UUID, allowNull: false })
    declare prodCode: string;

    @BelongsTo(() => Product)
    declare product?: Product;

    // Fracción 0-1, igual convención que Client.discountPercentage/Promo.discountPercentage.
    @Column({ type: DataType.DECIMAL(5, 4), allowNull: false })
    declare discountPercentage: number;
}
