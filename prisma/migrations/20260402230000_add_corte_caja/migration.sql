-- Add corte_id to ventas
ALTER TABLE "ventas" ADD COLUMN "corte_id" INTEGER;

-- Create cortes_caja table
CREATE TABLE "cortes_caja" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "cantidad_ventas" INTEGER NOT NULL,
    "total_efectivo" DECIMAL(12,2) NOT NULL,
    "total_transferencia" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total_iva" DECIMAL(12,2) NOT NULL,
    "total_con_iva" DECIMAL(12,2) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cortes_caja_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cortes_caja_fecha_sucursal_id_key" ON "cortes_caja"("fecha", "sucursal_id");

ALTER TABLE "cortes_caja" ADD CONSTRAINT "cortes_caja_sucursal_id_fkey"
    FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cortes_caja" ADD CONSTRAINT "cortes_caja_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ventas" ADD CONSTRAINT "ventas_corte_id_fkey"
    FOREIGN KEY ("corte_id") REFERENCES "cortes_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;
