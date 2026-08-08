-- =====================================================================
-- MIGRACIÓN: sistema de permisos dinámicos (RBAC por tipo de usuario)
-- Se agrega SOBRE el esquema existente, sin modificar tablas actuales.
-- No requiere cambios en "user": userType ya usa el mismo dominio de
-- valores ('admin','seller') que necesitamos aquí.
-- =====================================================================

-- =====================================================================
-- 27. module
-- =====================================================================
CREATE TABLE module (
    "moduleID"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "moduleKey"   VARCHAR(50) NOT NULL UNIQUE,   -- 'products', 'inventory', etc.
    "moduleName"  VARCHAR(100) NOT NULL          -- nombre visible en el menú
);

-- =====================================================================
-- 28. rolePermission
-- =====================================================================
CREATE TABLE "rolePermission" (
    "permissionID"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userType"      VARCHAR(10) NOT NULL CHECK ("userType" IN ('admin','seller')),
    "moduleID"      UUID NOT NULL REFERENCES module("moduleID") ON DELETE CASCADE,
    "canView"       BOOLEAN NOT NULL DEFAULT false,
    "canCreate"     BOOLEAN NOT NULL DEFAULT false,
    "canEdit"       BOOLEAN NOT NULL DEFAULT false,
    "canDelete"     BOOLEAN NOT NULL DEFAULT false,
    UNIQUE ("userType", "moduleID")
);

CREATE INDEX idx_rolePermission_moduleID ON "rolePermission"("moduleID");

-- =====================================================================
-- SEED: catálogo inicial de módulos/pantallas
-- Ajusta las claves ("moduleKey") a las rutas reales de tu frontend.
-- =====================================================================
INSERT INTO module ("moduleKey", "moduleName") VALUES
    ('products',     'Productos'),
    ('inventory',    'Inventario'),
    ('transactions', 'Ventas y pedidos'),
    ('clients',      'Clientes'),
    ('suppliers',    'Proveedores'),
    ('reports',      'Reportes'),
    ('cash',         'Caja'),
    ('users',        'Usuarios'),
    ('permissions',  'Administración de permisos');

-- =====================================================================
-- SEED: permisos por defecto para admin -> acceso total a todo
-- =====================================================================
INSERT INTO "rolePermission" ("userType", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT 'admin', "moduleID", true, true, true, true
FROM module;

-- =====================================================================
-- SEED: permisos por defecto para seller -> ajusta a tu criterio real,
-- esto es solo un punto de partida razonable. El admin podrá cambiar
-- estos valores después desde la pantalla de administración.
-- 'users' y 'permissions' se omiten a propósito: sin fila = sin acceso.
-- =====================================================================
INSERT INTO "rolePermission" ("userType", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT
    'seller',
    "moduleID",
    true,                                             -- canView
    ("moduleKey" IN ('transactions','clients')),      -- canCreate
    ("moduleKey" IN ('transactions','clients')),      -- canEdit
    false                                              -- canDelete
FROM module
WHERE "moduleKey" NOT IN ('users','permissions');

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
