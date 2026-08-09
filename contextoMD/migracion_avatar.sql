-- =====================================================================
-- MIGRACIÓN: foto de perfil del usuario
-- =====================================================================
-- Se sube a Cloudinary (mismo mecanismo que ya usan las fotos de producto,
-- ver picture.controller.ts) vía PUT /users/me/avatar. avatarPublicId
-- guarda el public_id de Cloudinary para poder borrar la imagen anterior
-- cuando el usuario sube una nueva (evita dejar archivos huérfanos).
-- =====================================================================

ALTER TABLE "user"
ADD COLUMN "avatarUrl" VARCHAR(255);

ALTER TABLE "user"
ADD COLUMN "avatarPublicId" VARCHAR(255);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
