import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const sucursalCentroId = 1
const sucursalNorteId = 2

const productos = [
  {
    numeroSerie: 'CAR-FEND-001',
    nombre: 'Fender Delantero Honda Civic',
    descripcion: 'Fender delantero izquierdo para Honda Civic 2018-2022',
    marca: 'Honda',
    modelo: 'Civic 2018-2022',
    color: 'Negro',
    detalles: 'Material: acero galvanizado. Incluye refuerzo interno. Listo para pintar.',
    sucursalId: sucursalCentroId,
    precioUnitario: 2800.00,
    stock: 6,
  },
  {
    numeroSerie: 'CAR-FEND-002',
    nombre: 'Fender Trasero Toyota Corolla',
    descripcion: 'Fender trasero derecho compatible con Toyota Corolla 2019-2023',
    marca: 'Toyota',
    modelo: 'Corolla 2019-2023',
    color: 'Blanco',
    detalles: 'OEM compatible. Material: polímero reforzado. Apto para acabado a pintura.',
    sucursalId: sucursalNorteId,
    precioUnitario: 3200.00,
    stock: 4,
  },
  {
    numeroSerie: 'CAR-HEAD-001',
    nombre: 'Faro Delantero LED Nissan Sentra',
    descripcion: 'Faro delantero lado conductor para Nissan Sentra 2020-2023',
    marca: 'Nissan',
    modelo: 'Sentra 2020-2023',
    color: 'Transparente',
    detalles: 'Tecnología LED. Plug & play. Incluye arillos DRL. Certificado SAE/DOT.',
    sucursalId: sucursalCentroId,
    precioUnitario: 4500.00,
    stock: 5,
  },
  {
    numeroSerie: 'CAR-HEAD-002',
    nombre: 'Faro Trasero Volkswagen Jetta',
    descripcion: 'Calavera trasera izquierda para Volkswagen Jetta 2016-2021',
    marca: 'Volkswagen',
    modelo: 'Jetta 2016-2021',
    color: 'Rojo/Ámbar',
    detalles: 'Incluye socket y cableado. Vidrio policarbonato. Sellado hermético IP67.',
    sucursalId: sucursalNorteId,
    precioUnitario: 1950.00,
    stock: 8,
  },
  {
    numeroSerie: 'CAR-WIN-001',
    nombre: 'Parabrisas Chevrolet Aveo',
    descripcion: 'Parabrisas delantero con banda de oscurecimiento para Chevrolet Aveo 2012-2019',
    marca: 'Chevrolet',
    modelo: 'Aveo 2012-2019',
    color: 'Verde claro',
    detalles: 'Vidrio templado laminado. Incluye adhesivo de instalación. Certificado FMVSS 205.',
    sucursalId: sucursalCentroId,
    precioUnitario: 5800.00,
    stock: 3,
  },
  {
    numeroSerie: 'CAR-WIN-002',
    nombre: 'Vidrio Lateral Mazda 3',
    descripcion: 'Vidrio de puerta trasera izquierda para Mazda 3 2014-2018',
    marca: 'Mazda',
    modelo: 'Mazda 3 2014-2018',
    color: 'Azul oscuro',
    detalles: 'Vidrio templado. Encaje directo en canal de goma. Sin orificio de antena.',
    sucursalId: sucursalNorteId,
    precioUnitario: 1400.00,
    stock: 10,
  },
  {
    numeroSerie: 'CAR-BAT-001',
    nombre: 'Batería AGM 70Ah Bosch',
    descripcion: 'Batería de auto libre de mantenimiento 70 Ah para vehículos de uso intensivo',
    marca: 'Bosch',
    modelo: 'S5 A08 AGM',
    color: 'Negro',
    detalles: '70 Ah / 760 A CCA. Tecnología AGM. Garantía 2 años. Terminales estándar.',
    sucursalId: sucursalCentroId,
    precioUnitario: 3900.00,
    stock: 12,
  },
  {
    numeroSerie: 'CAR-BAT-002',
    nombre: 'Batería GEL 45Ah Varta',
    descripcion: 'Batería de ciclo profundo para autos pequeños y motos de alta cilindrada',
    marca: 'Varta',
    modelo: 'Blue Dynamic D24',
    color: 'Azul',
    detalles: '45 Ah / 420 A CCA. Libre de mantenimiento. Baja autodescarga. Terminal SAE.',
    sucursalId: sucursalNorteId,
    precioUnitario: 2200.00,
    stock: 9,
  },
  {
    numeroSerie: 'CAR-MOT-001',
    nombre: 'Motor de Arranque Ford F-150',
    descripcion: 'Motor de arranque remanufacturado para Ford F-150 V8 2011-2017',
    marca: 'Ford',
    modelo: 'F-150 V8 2011-2017',
    color: 'Gris',
    detalles: 'Potencia: 1.4 kW. 12V. Dientes piñón: 10. Remanufacturado con garantía 1 año.',
    sucursalId: sucursalCentroId,
    precioUnitario: 7200.00,
    stock: 2,
  },
  {
    numeroSerie: 'CAR-MOT-002',
    nombre: 'Motor Alternador Kia Sportage',
    descripcion: 'Alternador original remanufacturado para Kia Sportage 2.0 2016-2022',
    marca: 'Kia',
    modelo: 'Sportage 2.0 2016-2022',
    color: 'Plateado',
    detalles: 'Salida: 90A / 12V. Regulador interno incluido. Polea con embrague de sobremarcha.',
    sucursalId: sucursalNorteId,
    precioUnitario: 5500.00,
    stock: 4,
  },
]

async function main() {
  // Delete all products (also cascades venta_detalles referencing them if any)
  const deleted = await prisma.producto.deleteMany({})
  console.log(`🗑  Eliminados ${deleted.count} productos`)

  // Insert new products
  for (const p of productos) {
    await prisma.producto.create({ data: p })
  }

  console.log(`✅ Insertados ${productos.length} productos de autopartes`)
  console.log('\nProductos agregados:')
  productos.forEach((p) => console.log(`  • ${p.nombre} (${p.numeroSerie}) — $${p.precioUnitario.toLocaleString('es-MX')} | Stock: ${p.stock}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
