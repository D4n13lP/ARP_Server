# Contexto: sistema de autenticación, roles y permisos

Proyecto: Acabados Rústicos Pirámides — React + TypeScript (frontend), Express (backend), PostgreSQL (base de datos).

Este documento resume las decisiones de diseño ya tomadas para que se implementen de forma consistente. La base de datos ya tiene las tablas base (product, transaction, client, user, etc.) — este contexto cubre solo lo agregado para autenticación y permisos.

## 1. Roles de usuario

La tabla `user` ya existe con `userType VARCHAR(10) CHECK ("userType" IN ('admin','seller'))`. Solo hay dos roles: `admin` y `seller`. No se usa una tabla `role` aparte — la relación entre `user.userType` y `rolePermission.userType` es **lógica** (mismo dominio de valores), no una FK física, porque `userType` no es único en `user`.

## 2. Permisos dinámicos por pantalla (RBAC configurable)

Tablas ya creadas en la base de datos:

- `module`: catálogo de pantallas del frontend (`moduleID` UUID PK, `moduleKey` VARCHAR UNIQUE, `moduleName` VARCHAR).
- `rolePermission`: reglas de acceso (`permissionID` UUID PK, `userType` VARCHAR CHECK admin/seller, `moduleID` FK a module, `canView`/`canCreate`/`canEdit`/`canDelete` BOOLEAN default false, `UNIQUE(userType, moduleID)`).

**Falta implementar:**
- Middleware Express `authenticateToken` (verifica JWT) y `checkPermission(moduleKey, action)` (consulta `rolePermission`).
- Endpoint `GET /permissions` y `PUT /permissions/:userType/:moduleID` para que el admin edite permisos desde el frontend.
- En React: `AuthContext` que guarde `permissions` tras el login, `ProtectedRoute` por `moduleKey`, y ocultar botones/menú según `canView`/`canEdit`/`canCreate`/`canDelete`.
- Pantalla de administración de permisos: tabla con checkboxes por módulo, solo visible para `admin`.

## 3. Autenticación (login)

- Login normal: `bcrypt.compare` contra `user.password` (hash bcrypt), genera JWT con `{ userID, userType }`, expira en 8h.
- El login debe rechazar el acceso si `user.isEmailVerified = false`.

## 4. Verificación de correo (solo para registro público de vendedores)

Tablas ya creadas:
- `user.isEmailVerified` BOOLEAN default false (columna agregada).
- `emailVerificationToken`: `verificationTokenID` UUID PK, `userID` FK, `tokenHash` VARCHAR (**SHA-256 del token**, no el token plano), `expiresAt` TIMESTAMP WITH TIME ZONE, `createdAt`.

**Regla de seguridad clave:** el token que se manda por correo es aleatorio (`crypto.randomBytes(32).toString('hex')`); lo que se guarda en la base es su hash SHA-256 (`crypto.createHash('sha256').update(token).digest('hex')`). Nunca se guarda el token en texto plano.

**Falta implementar:**
- `POST /auth/register`: crea usuario con `userType = 'seller'` **hardcodeado en el backend** (nunca tomar `userType` del body — evita escalamiento de privilegios). Genera token, lo guarda hasheado con expiración de 24h, envía correo.
- `GET /auth/verify-email?token=...`: hashea el token recibido, busca coincidencia no expirada en `emailVerificationToken`, marca `user.isEmailVerified = true`, borra los tokens de ese usuario.

## 5. Creación del administrador (sin scripts de terminal)

**Decisión final (reemplaza cualquier diseño anterior con script de bootstrap):** no hay pantalla especial de registro de admin ni script de terminal. Se usa el mismo formulario público de registro para todos, con esta regla:

- **Primer usuario del sistema:** si `SELECT COUNT(*) FROM "user"` es 0 en el momento del registro, ese usuario se crea con `userType = 'admin'`. Se sigue exigiendo verificación de correo igual que a cualquier otro usuario (no hay excepción de seguridad para el primer admin).
- **Todos los registros posteriores:** se crean con `userType = 'seller'`, sin excepción — nunca se toma `userType` del `req.body`.
- **Condición de carrera:** para evitar que dos registros simultáneos con la tabla vacía terminen ambos como admin, el `POST /auth/register` debe envolver el conteo + insert en una transacción con `SELECT pg_advisory_xact_lock(42)` al inicio, serializando los registros mientras se decide el rol.
- **Elevar un usuario existente a admin:** endpoint `PUT /users/:userID/promote`, protegido con `authenticateToken` + `authorizeRoles('admin')`. Solo un admin con sesión activa puede llamarlo. Hace `UPDATE "user" SET "userType" = 'admin' WHERE "userID" = $1`.
- **No implementado (fuera de alcance por ahora):** degradar a un admin de vuelta a seller. Si se agrega en el futuro, debe validar que no sea el último admin del sistema antes de permitirlo, para no dejar la aplicación sin ningún administrador.

**Falta implementar:** el endpoint `POST /auth/register` con la lógica de primer-usuario-es-admin + advisory lock, y el endpoint `PUT /users/:userID/promote`.

## 6. Recuperación de contraseña

Tabla ya creada:
- `passwordResetToken`: `resetTokenID` UUID PK, `userID` FK, `tokenHash` VARCHAR (SHA-256), `expiresAt` TIMESTAMP WITH TIME ZONE, `isUsed` BOOLEAN default false, `createdAt`.

**Correo de recuperación opcional (columna nueva):**
- `user.recoveryEmail` VARCHAR(150) UNIQUE, nullable — un segundo correo opcional que el usuario puede registrar desde su perfil, distinto al correo principal (`user.email`). Sirve para poder recibir el link de reset aunque haya perdido acceso al correo principal.
- No se exige al registrarse. Se agrega/edita después, desde una pantalla de perfil, con un endpoint tipo `PUT /users/me/recovery-email` protegido por `authenticateToken` (cualquier usuario autenticado puede fijar el suyo, no solo el admin).
- Es especialmente útil para el caso del admin único del sistema (ver problema del "primer admin sin forma de recuperar acceso" discutido antes) — pero aplica a cualquier tipo de usuario.

**Falta implementar:**
- `POST /auth/forgot-password`: recibe un email (puede ser el principal o el de recuperación), busca con `WHERE email = $1 OR "recoveryEmail" = $1`. Si hay coincidencia, genera token + hash + expiración de 1h, y **envía el correo a la dirección que el usuario escribió en el formulario** (la que sí tiene acceso en ese momento), no necesariamente a `user.email`. **Responde el mismo mensaje exista o no el correo** (no revelar qué emails están registrados).
- `POST /auth/reset-password`: recibe `token` + `newPassword`, hashea el token recibido, busca coincidencia válida y no usada, actualiza `user.password` (con bcrypt), marca el token como `isUsed = true`.
- `PUT /users/me/recovery-email`: guarda/actualiza `recoveryEmail` del usuario autenticado. Validar formato de correo y que no esté ya en uso por otro usuario (la restricción `UNIQUE` de la columna ya lo garantiza a nivel de base de datos, pero conviene capturar el error y devolver un mensaje claro en vez del error crudo de Postgres).
- Frontend: formulario "olvidé mi contraseña" (pide email — principal o de recuperación, no se distingue en el formulario), formulario "nueva contraseña" (lee `token` de la URL, pide password nueva), y un campo opcional "correo de recuperación" en la pantalla de perfil de cualquier usuario.

## 7. Envío de correos

**Decisión final: Resend** (paquete npm `resend`).

- API key en variable de entorno `RESEND_API_KEY` (nunca en el código ni en el repo).
- Módulo centralizado `utils/mailer.js` con dos funciones: `sendVerificationEmail(email, token)` y `sendResetEmail(email, token)`, ambas usando `resend.emails.send({...})` con `html` inline. Los enlaces usan `process.env.APP_URL` como base (ej. `${APP_URL}/verify-email?token=...`).
- **Mientras el dominio propio no esté verificado en el dashboard de Resend**, solo se puede enviar desde la dirección de pruebas `onboarding@resend.dev`, y los correos únicamente llegan a la bandeja asociada a la cuenta de Resend — suficiente para desarrollo, no para producción.
- **Para producción:** verificar el dominio propio en Resend (registros DNS SPF/DKIM) y cambiar el remitente (`from`) a una dirección del dominio real, ej. `notificaciones@acabadosrusticospiramides.com`.
- Los endpoints que llaman a `sendVerificationEmail`/`sendResetEmail` deben envolver la llamada en `try/catch`: si Resend falla, el usuario ya pudo haberse creado en la BD, así que hay que decidir si se revierte el insert o solo se le avisa que hubo un problema con el envío.

## Archivos SQL ya generados (deben estar corridos en la base de datos antes de escribir el backend)

1. `migracion_permisos.sql` — tablas `module` y `rolePermission` + seed inicial.
2. `migracion_tokens_verificacion.sql` — columna `user.isEmailVerified` + tablas `emailVerificationToken` y `passwordResetToken`.
3. `migracion_recovery_email.sql` — columna `user.recoveryEmail` (VARCHAR, UNIQUE, nullable).

## Próximo paso pendiente

Construir los endpoints de Express (`/auth/register`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/users/:userID/promote`, `/users/me/recovery-email`, `/permissions`), el módulo `utils/mailer.js` con Resend, y las pantallas de React correspondientes, siguiendo exactamente las reglas de seguridad descritas arriba (hash de tokens, userType nunca desde el cliente, mismo mensaje en forgot-password exista o no el email, recoveryEmail opcional y editable solo por su propio dueño).
