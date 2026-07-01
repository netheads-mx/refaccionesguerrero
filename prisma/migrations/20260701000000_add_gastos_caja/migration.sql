-- AlterTable
ALTER TABLE "cortes_caja" ADD COLUMN "total_gastos" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "gastos_caja" (
    "id" SERIAL NOT NULL,
    "corte_id" INTEGER NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "gastos_caja_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gastos_caja" ADD CONSTRAINT "gastos_caja_corte_id_fkey" FOREIGN KEY ("corte_id") REFERENCES "cortes_caja"("id") ON DELETE CASCADE ON UPDATE CASCADE;
