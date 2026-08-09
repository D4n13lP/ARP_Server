-- =====================================================================
-- MIGRACIÓN: aprobación de cuentas nuevas (isAllowed)
-- =====================================================================
-- Nuevos registros quedan bloqueados (isAllowed = false por default) hasta
-- que un admin los aprueba desde la pantalla de administración de cuentas.
-- El primer usuario del sistema (el admin original) se crea directamente
-- con isAllowed = true en el backend, porque no hay nadie más que lo
-- pudiera aprobar.
-- =====================================================================

ALTER TABLE "user"
ADD COLUMN "isAllowed" BOOLEAN NOT NULL DEFAULT false;

-- No relitigamos el acceso de cuentas que ya estaban activas y verificadas
-- antes de que existiera esta columna — solo los registros nuevos, de aquí
-- en adelante, quedan sujetos a aprobación.
UPDATE "user" SET "isAllowed" = true WHERE "isEmailVerified" = true;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
