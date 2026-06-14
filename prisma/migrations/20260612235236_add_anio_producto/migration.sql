-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_sucursal_id_fkey";

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "anio_fin" INTEGER,
ADD COLUMN     "anio_inicio" INTEGER;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
