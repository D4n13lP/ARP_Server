-- =====================================================================
-- MIGRACIÓN: correo de recuperación opcional
-- =====================================================================
-- Permite que un usuario registre un segundo correo (distinto al
-- principal) para poder recuperar el acceso si pierde el primero.
-- Es opcional: NULL por defecto, no se exige al registrarse.
-- UNIQUE para evitar ambigüedad al buscar una cuenta por este campo
-- (si dos usuarios pudieran compartir el mismo recoveryEmail, el flujo
-- de "olvidé mi contraseña" no sabría a cuál de los dos pertenece).
-- =====================================================================

ALTER TABLE "user"
ADD COLUMN "recoveryEmail" VARCHAR(150) UNIQUE;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
