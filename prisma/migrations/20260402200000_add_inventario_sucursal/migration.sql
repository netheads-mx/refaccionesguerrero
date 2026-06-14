-- CreateTable: inventario_sucursal
CREATE TABLE "inventario_sucursal" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventario_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per product+branch pair
CREATE UNIQUE INDEX "inventario_sucursal_producto_id_sucursal_id_key"
    ON "inventario_sucursal"("producto_id", "sucursal_id");

-- AddForeignKey
ALTER TABLE "inventario_sucursal" ADD CONSTRAINT "inventario_sucursal_producto_id_fkey"
    FOREIGN KEY ("producto_id") REFERENCES "productos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventario_sucursal" ADD CONSTRAINT "inventario_sucursal_sucursal_id_fkey"
    FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing stock data before dropping old columns
INSERT INTO "inventario_sucursal" ("producto_id", "sucursal_id", "stock")
SELECT "id", "sucursal_id", "stock"
FROM "productos"
WHERE "sucursal_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "productos" DROP CONSTRAINT IF EXISTS "productos_sucursal_id_fkey";

-- DropColumns
ALTER TABLE "productos" DROP COLUMN "sucursal_id";
ALTER TABLE "productos" DROP COLUMN "stock";
