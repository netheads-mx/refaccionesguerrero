-- Reassign any existing 'tarjeta' sales to 'efectivo' before removing the enum value
UPDATE "ventas" SET "metodo_pago" = 'efectivo' WHERE "metodo_pago" = 'tarjeta';

-- Recreate enum without 'tarjeta'
ALTER TYPE "MetodoPago" RENAME TO "MetodoPago_old";
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'transferencia');
ALTER TABLE "ventas" ALTER COLUMN "metodo_pago" TYPE "MetodoPago" USING "metodo_pago"::text::"MetodoPago";
DROP TYPE "MetodoPago_old";
