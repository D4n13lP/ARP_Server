// src/utils/employeeCode.ts
// Código corto y memorizable para identificar a un usuario (gafete, decirlo de
// palabra) — no es la llave primaria, solo referencia. Ver
// contextoMD/migracion_employee_code.sql.
import crypto from 'crypto'
import type { Transaction } from 'sequelize'
import { User } from '../models/index.js'

// Sin 0/O, 1/I/L: se prestan a confusión al leerlos o dictarlos en voz alta.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const CODE_LENGTH = 9

export function generateEmployeeCode(): string {
    let code = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
        code += ALPHABET[crypto.randomInt(ALPHABET.length)]
    }
    return code
}

// Genera un código y confirma que no choque con uno ya existente. Con
// 31^9 combinaciones posibles, chocar es prácticamente imposible — el
// reintento es solo una red de seguridad, no algo que se espere disparar.
export async function generateUniqueEmployeeCode(transaction?: Transaction): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateEmployeeCode()
        const exists = await User.findOne({ where: { employeeCode: candidate }, transaction })
        if (!exists) {
            return candidate
        }
    }
    throw new Error('No se pudo generar un employeeCode único, intenta de nuevo')
}
