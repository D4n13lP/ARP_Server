// src/server.ts
import express from 'express'
import colors from 'colors'
import router from './router.js'
import db from './config/db.js'

// Conectar a base de datos
// OJO: nunca uses db.sync() aquí. Las tablas ya existen (las creaste con
// schema.sql en pgAdmin/DBeaver); sync() intentaría alterarlas para que
// coincidan con los modelos y puede romper columnas generadas, triggers
// o constraints que el script SQL ya dejó configurados.
async function connectDB() {
    try {
        await db.authenticate()
        console.log(colors.blue('Base de datos conectada'))
    } catch (error) {
        console.log(colors.bgRed.white('Hubo un error al conectar a la base de datos'))
        console.log(error)
    }
}

connectDB()

const server = express()

server.use(express.json())
server.use('/', router)

export default server
