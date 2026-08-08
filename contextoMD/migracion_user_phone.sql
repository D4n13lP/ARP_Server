-- =====================================================================
-- MIGRACIÓN: teléfono opcional del usuario
-- =====================================================================
-- Campo del formulario de registro público (pantalla RegisterUser_Page en
-- el frontend). Opcional, igual que recoveryEmail — no bloquea el registro.
-- =====================================================================

ALTER TABLE "user"
ADD COLUMN "phone" VARCHAR(20);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
