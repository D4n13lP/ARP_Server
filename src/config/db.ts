// src/config/db.ts
import { Sequelize } from 'sequelize-typescript'
import dotenv from 'dotenv'
import * as models from '../models/index.js'

dotenv.config()

// Registramos los modelos de forma EXPLÍCITA (no con una ruta glob tipo
// 'models/**/*.model.ts'). Con tsx/ts-node ejecutando .ts directamente
// (sin pasar por dist/), el autodescubrimiento por carpeta suele fallar
// o cargar en un orden que rompe las asociaciones. Pasar el arreglo de
// clases es más lento de escribir pero 100% confiable.
const db = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false, // Render usa certificados que Node no valida por defecto
        },
    },
    models: Object.values(models) as any[],
    logging: false,
})

export default db
