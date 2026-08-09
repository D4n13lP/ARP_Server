-- =====================================================================
-- MIGRACIÓN: módulo "Almacenes" (nueva pantalla de administración)
-- =====================================================================
-- Sigue exactamente el mismo patrón que migracion_modulos_por_vista.sql:
-- se agrega la fila a "module" y se hereda a rolePermission/userPermission
-- para que aparezca en el panel "Vistas permitidas" de
-- OtherAccountSettings_Page.
-- =====================================================================

INSERT INTO module ("moduleKey", "moduleName") VALUES
    ('warehouses', 'Almacenes');

-- admin -> acceso total
INSERT INTO "rolePermission" ("userType", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT 'admin', "moduleID", true, true, true, true
FROM module
WHERE "moduleKey" = 'warehouses';

-- seller -> solo lectura por default (igual que el resto de pantallas de
-- catálogo/administración; el admin lo ajusta por persona si hace falta)
INSERT INTO "rolePermission" ("userType", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT 'seller', "moduleID", true, false, false, false
FROM module
WHERE "moduleKey" = 'warehouses';

-- Usuarios ya existentes heredan el default de su rol para este módulo nuevo.
INSERT INTO "userPermission" ("userID", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT u."userID", rp."moduleID", rp."canView", rp."canCreate", rp."canEdit", rp."canDelete"
FROM "user" u
JOIN "rolePermission" rp ON rp."userType" = u."userType"
JOIN module m ON m."moduleID" = rp."moduleID" AND m."moduleKey" = 'warehouses'
WHERE NOT EXISTS (
    SELECT 1 FROM "userPermission" up
    WHERE up."userID" = u."userID" AND up."moduleID" = rp."moduleID"
);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
