// src/utils/mailer.ts
// Módulo centralizado de envío de correos (Resend). Ver contextoMD/CONTEXTO_PERMISOS_AUTH.md, sección 7.
import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config()

// El SDK de Resend lanza síncronamente si el constructor recibe un key vacío,
// lo que tumbaría el server entero al importar este módulo. Lo instanciamos
// perezosamente para que, si falta RESEND_API_KEY, el error salga solo cuando
// de verdad se intenta enviar un correo — y quede atrapado por el try/catch
// del controller que llama a sendVerificationEmail/sendResetEmail.
let resend: Resend | undefined

function getResendClient(): Resend {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY no está configurado — no se puede enviar el correo')
    }
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY)
    }
    return resend
}

// Mientras el dominio propio no esté verificado en el dashboard de Resend, solo
// se puede enviar desde esta dirección de pruebas (y solo llega a la bandeja
// de la cuenta de Resend). Para producción, verifica el dominio y cambia esto
// a algo como notificaciones@acabadosrusticospiramides.com vía EMAIL_FROM.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'onboarding@resend.dev'

const APP_URL = process.env.APP_URL || 'http://localhost:5173'

// userName lo escribe el propio usuario en el registro; a diferencia de `link`
// (armado por nosotros a partir de APP_URL + token), este si hay que escaparlo
// antes de meterlo en el HTML del correo.
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export async function sendVerificationEmail(email: string, token: string) {
    const link = `${APP_URL}/verify-email?token=${token}`
    return getResendClient().emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: 'Confirma tu correo — Acabados Rústicos Pirámides',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Confirma tu cuenta</h2>
                <p>Gracias por registrarte. Confirma tu correo para poder iniciar sesión:</p>
                <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Confirmar correo</a></p>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all;">${link}</p>
                <p>Este enlace expira en 24 horas. Si tú no creaste esta cuenta, ignora este correo.</p>
            </div>
        `,
    })
}

export async function sendResetEmail(email: string, token: string) {
    const link = `${APP_URL}/reset-password?token=${token}`
    return getResendClient().emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: 'Recupera tu contraseña — Acabados Rústicos Pirámides',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Recuperar contraseña</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic aquí:</p>
                <p><a href="${link}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Restablecer contraseña</a></p>
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all;">${link}</p>
                <p>Este enlace expira en 1 hora. Si tú no solicitaste esto, ignora este correo — tu contraseña seguirá siendo la misma.</p>
            </div>
        `,
    })
}

// Se manda cuando isEmailVerified pasa a true (ver verifyEmail en auth.controller.ts),
// no al registrarse — la cuenta apenas queda activa hasta ese momento.
export async function sendWelcomeEmail(email: string, userName: string, employeeCode: string) {
    const safeUserName = escapeHtml(userName)
    return getResendClient().emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: '¡Bienvenido a Acabados Rústicos Pirámides!',
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>¡Bienvenido, ${safeUserName}!</h2>
                <p>Tu cuenta ya está activa. Este es tu número de empleado — guárdalo, es tu identificador dentro del sistema:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background:#f3f4f6; padding: 14px 20px; border-radius: 8px; text-align:center;">${employeeCode}</p>
                <p>Ya puedes iniciar sesión con tu correo y tu contraseña.</p>
            </div>
        `,
    })
}
