-- =====================================================================
-- MIGRACIÓN: "quién cobró" cada abono/pago (columna "Cobró" en
-- OrderDetail_Page). paymentHistory no tenía ninguna referencia a qué
-- usuario registró el pago — se agrega collectedByUserID.
-- =====================================================================

ALTER TABLE "paymentHistory"
    ADD COLUMN "collectedByUserID" uuid NULL;

ALTER TABLE "paymentHistory"
    ADD CONSTRAINT "paymentHistory_collectedByUserID_fkey"
    FOREIGN KEY ("collectedByUserID") REFERENCES "user"("userID") ON DELETE SET NULL;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
