-- =====================================================================
-- MIGRACIÓN: permisos por persona individual (reemplaza el uso de
-- rolePermission para la pantalla de administración de cuentas)
-- =====================================================================
-- rolePermission NO se borra: sigue existiendo como "plantilla" por
-- tipo de cuenta (admin/seller). Cuando se crea un usuario nuevo, sus
-- permisos individuales se siembran copiando la plantilla de su rol en
-- ese momento — de ahí en adelante son independientes y editables por
-- persona, sin afectar a nadie más.
-- =====================================================================

CREATE TABLE "userPermission" (
    "userPermissionID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID"    UUID NOT NULL REFERENCES "user"("userID") ON DELETE CASCADE,
    "moduleID"  UUID NOT NULL REFERENCES module("moduleID") ON DELETE CASCADE,
    "canView"   BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit"   BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    UNIQUE ("userID", "moduleID")
);

CREATE INDEX idx_userPermission_userID ON "userPermission"("userID");
CREATE INDEX idx_userPermission_moduleID ON "userPermission"("moduleID");

-- =====================================================================
-- SEED: los usuarios que ya existen hoy heredan los permisos de su rol
-- actual como punto de partida (después el admin los edita persona por
-- persona desde la pantalla de administración de cuentas).
-- =====================================================================
INSERT INTO "userPermission" ("userID", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT u."userID", rp."moduleID", rp."canView", rp."canCreate", rp."canEdit", rp."canDelete"
FROM "user" u
JOIN "rolePermission" rp ON rp."userType" = u."userType";

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
