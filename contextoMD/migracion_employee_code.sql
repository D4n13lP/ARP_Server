-- =====================================================================
-- MIGRACIÓN: código corto de empleado (solo referencia, no es la llave primaria)
-- =====================================================================
-- userID sigue siendo la llave primaria real (UUID), usada tal cual por
-- transUser, totalCash, emailVerificationToken y passwordResetToken. Este
-- campo nuevo es puramente un identificador corto y memorizable que se le
-- muestra al usuario (p.ej. en su gafete o para identificarse de palabra);
-- la aplicación lo genera sola al registrarse, nunca lo escribe el usuario.
-- =====================================================================

ALTER TABLE "user"
ADD COLUMN "employeeCode" VARCHAR(9) UNIQUE NOT NULL DEFAULT '';

-- El DEFAULT '' es solo para poder agregar la columna como NOT NULL sin
-- romper si ya hubiera filas (hoy la tabla está vacía). Lo quitamos para
-- que de aquí en adelante el backend esté obligado a mandar un valor real.
ALTER TABLE "user"
ALTER COLUMN "employeeCode" DROP DEFAULT;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
