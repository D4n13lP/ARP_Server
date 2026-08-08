-- =====================================================================
-- MIGRACIÓN: Soporte para Verificación de Correo y Reset de Contraseña
-- =====================================================================
-- 1. Agregar bandera de verificación a la tabla "user"
ALTER TABLE "user"
ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Tabla para Tokens de Verificación de Correo (Confirmación de cuenta)
CREATE TABLE "emailVerificationToken" (
    "verificationTokenID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID"              UUID NOT NULL REFERENCES "user"("userID") ON DELETE CASCADE,
    "tokenHash"           VARCHAR(255) NOT NULL, -- Hash SHA-256 del token
    "expiresAt"           TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_emailVerificationToken_userID ON "emailVerificationToken"("userID");
CREATE INDEX idx_emailVerificationToken_hash ON "emailVerificationToken"("tokenHash");

-- 3. Tabla para Tokens de Reestablecimiento de Contraseña (Forgot Password)
CREATE TABLE "passwordResetToken" (
    "resetTokenID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userID"       UUID NOT NULL REFERENCES "user"("userID") ON DELETE CASCADE,
    "tokenHash"    VARCHAR(255) NOT NULL, -- Hash SHA-256 del token
    "expiresAt"    TIMESTAMP WITH TIME ZONE NOT NULL,
    "isUsed"       BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_passwordResetToken_userID ON "passwordResetToken"("userID");
CREATE INDEX idx_passwordResetToken_hash ON "passwordResetToken"("tokenHash");
-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
