-- CreateTable
CREATE TABLE "marcas_auto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "pais" VARCHAR(80),

    CONSTRAINT "marcas_auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos_auto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "marca_id" INTEGER NOT NULL,

    CONSTRAINT "modelos_auto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones_auto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "modelo_id" INTEGER NOT NULL,
    "anio_inicio" INTEGER NOT NULL,
    "anio_fin" INTEGER,
    "motor" VARCHAR(100),
    "transmision" VARCHAR(80),

    CONSTRAINT "versiones_auto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marcas_auto_nombre_key" ON "marcas_auto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_auto_marca_id_nombre_key" ON "modelos_auto"("marca_id", "nombre");

-- AddForeignKey
ALTER TABLE "modelos_auto" ADD CONSTRAINT "modelos_auto_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas_auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_auto" ADD CONSTRAINT "versiones_auto_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos_auto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
