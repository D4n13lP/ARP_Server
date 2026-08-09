-- =====================================================================
-- MIGRACIÓN: un módulo por cada pantalla real del frontend
-- =====================================================================
-- Hasta ahora "module" solo tenía 9 secciones amplias. El admin necesita
-- poder activar/desactivar pantallas específicas por persona (p. ej.
-- "Cuentas de pago", antes "Registrar Cuenta Destino") desde el panel
-- "Vistas permitidas" de OtherAccountSettings_Page — y ese panel ya
-- muestra automáticamente cualquier fila que exista en "module", así que
-- esta migración es puramente de datos, sin tocar código de esa pantalla.
--
-- No se tocan los 9 módulos existentes ni sus permisos ya configurados.
-- =====================================================================

INSERT INTO module ("moduleKey", "moduleName") VALUES
    ('dashboard',            'Indicadores'),
    ('add-product',          'Agregar producto'),
    ('add-products',         'Registro de productos'),
    ('product-catalog',      'Catálogo de productos'),
    ('register-products',    'Registro rápido de productos'),
    ('watch-products',       'Ver productos'),
    ('client-history',       'Historial de compras'),
    ('discounts',            'Descuentos'),
    ('clients-discount',     'Descuento para clientes'),
    ('discount-adjustment',  'Ajustar tipos de descuento'),
    ('promotion-setup',      'Configurar promoción'),
    ('deliverymen',          'Repartidores'),
    ('orders',               'Pedidos'),
    ('register-order',       'Registrar pedido'),
    ('update-order',         'Actualizar pedido'),
    ('order-detail',         'Detalle de pedido'),
    ('orders-report',        'Reporte de pedidos'),
    ('register-sale',        'Registrar venta'),
    ('sales-report',         'Reporte de ventas'),
    ('register-supplier',    'Registrar proveedor'),
    ('watch-suppliers',      'Ver proveedores'),
    ('supplier-detail',      'Detalle de proveedor'),
    ('destination-account',  'Cuentas de pago'),
    ('retiros',              'Retiro de efectivo');

-- =====================================================================
-- SEED: admin -> acceso total, igual que los módulos originales.
-- =====================================================================
INSERT INTO "rolePermission" ("userType", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT 'admin', "moduleID", true, true, true, true
FROM module
WHERE "moduleKey" IN (
    'dashboard','add-product','add-products','product-catalog','register-products',
    'watch-products','client-history','discounts','clients-discount','discount-adjustment',
    'promotion-setup','deliverymen','orders','register-order','update-order','order-detail',
    'orders-report','register-sale','sales-report','register-supplier','watch-suppliers',
    'supplier-detail','destination-account','retiros'
);

-- =====================================================================
-- SEED: seller -> lectura por default en todo; registrar/actualizar
-- pedidos y ventas también (es su trabajo del día a día, misma idea que
-- ya regía para 'transactions' y 'clients' en el seed original). El resto
-- (productos, proveedores, descuentos, cuentas de pago...) solo lectura:
-- el admin lo ajusta por persona desde el panel "Vistas permitidas".
-- =====================================================================
INSERT INTO "rolePermission" ("userType", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT
    'seller',
    "moduleID",
    true,                                              -- canView
    ("moduleKey" IN ('register-sale','register-order')), -- canCreate
    ("moduleKey" IN ('update-order')),                  -- canEdit
    false                                                -- canDelete
FROM module
WHERE "moduleKey" IN (
    'dashboard','add-product','add-products','product-catalog','register-products',
    'watch-products','client-history','discounts','clients-discount','discount-adjustment',
    'promotion-setup','deliverymen','orders','register-order','update-order','order-detail',
    'orders-report','register-sale','sales-report','register-supplier','watch-suppliers',
    'supplier-detail','destination-account','retiros'
);

-- =====================================================================
-- Los usuarios que ya existen (creados antes de esta migración) heredan
-- estos mismos valores por default para los módulos nuevos, igual que se
-- hizo al introducir userPermission — sin esto se quedarían sin ninguna
-- fila para las pantallas nuevas.
-- =====================================================================
INSERT INTO "userPermission" ("userID", "moduleID", "canView", "canCreate", "canEdit", "canDelete")
SELECT u."userID", rp."moduleID", rp."canView", rp."canCreate", rp."canEdit", rp."canDelete"
FROM "user" u
JOIN "rolePermission" rp ON rp."userType" = u."userType"
WHERE NOT EXISTS (
    SELECT 1 FROM "userPermission" up
    WHERE up."userID" = u."userID" AND up."moduleID" = rp."moduleID"
);

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
