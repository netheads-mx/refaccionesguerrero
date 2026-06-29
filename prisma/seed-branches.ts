import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const IVA = 16
const METODOS: ('efectivo' | 'transferencia')[] = ['efectivo', 'transferencia']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomDateLastDays(days: number): Date {
  const now  = Date.now()
  const from = now - days * 24 * 60 * 60 * 1000
  return new Date(from + Math.random() * (now - from))
}
function randomTimeToday(): Date {
  const d = new Date()
  d.setHours(rand(9, 18), rand(0, 59), 0, 0)
  return d
}

// ─── Auto parts catalogue ────────────────────────────────────────────────────

const PRODUCTOS_NUEVOS = [
  // Frenos
  { numeroSerie: 'FRN-001', nombre: 'Balatas Delanteras Brembo',        marca: 'Brembo',   modelo: 'P83071',      color: 'Gris',    precioUnitario: 780.00 },
  { numeroSerie: 'FRN-002', nombre: 'Disco de Freno Delantero ATE',     marca: 'ATE',      modelo: '24.0125-0156',color: 'Plata',   precioUnitario: 1250.00 },
  { numeroSerie: 'FRN-003', nombre: 'Cilindro Maestro de Frenos',       marca: 'Bosch',    modelo: 'F026003617',  color: 'Negro',   precioUnitario: 920.00 },
  { numeroSerie: 'FRN-004', nombre: 'Balatas Traseras Wagner',          marca: 'Wagner',   modelo: 'ZD1285',      color: 'Gris',    precioUnitario: 650.00 },
  // Motor
  { numeroSerie: 'MOT-001', nombre: 'Filtro de Aceite Bosch',           marca: 'Bosch',    modelo: 'F026407006',  color: 'Negro',   precioUnitario: 120.00 },
  { numeroSerie: 'MOT-002', nombre: 'Filtro de Aire K&N',               marca: 'K&N',      modelo: 'E-0644',      color: 'Rojo',    precioUnitario: 450.00 },
  { numeroSerie: 'MOT-003', nombre: 'Bujías NGK Iridium (x4)',          marca: 'NGK',      modelo: 'BKR6EIX-11',  color: 'Plata',   precioUnitario: 580.00 },
  { numeroSerie: 'MOT-004', nombre: 'Correa de Distribución Gates',     marca: 'Gates',    modelo: 'T217',        color: 'Negro',   precioUnitario: 890.00 },
  { numeroSerie: 'MOT-005', nombre: 'Junta de Culata Víctor Reinz',     marca: 'Reinz',    modelo: '61-36340-00', color: 'Plata',   precioUnitario: 1650.00 },
  { numeroSerie: 'MOT-006', nombre: 'Aceite Motul 5W-30 (4L)',          marca: 'Motul',    modelo: '8100 X-clean', color: 'Amarillo', precioUnitario: 480.00 },
  // Suspensión
  { numeroSerie: 'SUS-001', nombre: 'Amortiguador Delantero Monroe',    marca: 'Monroe',   modelo: '37111',       color: 'Naranja', precioUnitario: 1100.00 },
  { numeroSerie: 'SUS-002', nombre: 'Amortiguador Trasero KYB',         marca: 'KYB',      modelo: '343290',      color: 'Amarillo', precioUnitario: 980.00 },
  { numeroSerie: 'SUS-003', nombre: 'Terminal de Dirección Moog',       marca: 'Moog',     modelo: 'ES800614',    color: 'Plata',   precioUnitario: 420.00 },
  { numeroSerie: 'SUS-004', nombre: 'Rotula Inferior TRW',              marca: 'TRW',      modelo: 'JBJ757',      color: 'Plata',   precioUnitario: 560.00 },
  { numeroSerie: 'SUS-005', nombre: 'Barra Estabilizadora Completa',    marca: 'Moog',     modelo: 'K750396',     color: 'Negro',   precioUnitario: 730.00 },
  // Eléctrico
  { numeroSerie: 'ELC-001', nombre: 'Batería Optima RedTop 34/78',      marca: 'Optima',   modelo: '34/78',       color: 'Rojo',    precioUnitario: 2800.00 },
  { numeroSerie: 'ELC-002', nombre: 'Alternador Bosch 90A',             marca: 'Bosch',    modelo: 'AL9982X',     color: 'Plata',   precioUnitario: 2100.00 },
  { numeroSerie: 'ELC-003', nombre: 'Sensor de Oxígeno Denso',          marca: 'Denso',    modelo: '234-4209',    color: 'Plata',   precioUnitario: 620.00 },
  { numeroSerie: 'ELC-004', nombre: 'Foco Xenón H7 Phillips',           marca: 'Phillips', modelo: 'D1S85122',    color: 'Blanco',  precioUnitario: 380.00 },
  // Transmisión
  { numeroSerie: 'TRN-001', nombre: 'Embrague Sachs Kit Completo',      marca: 'Sachs',    modelo: '3000951903',  color: 'Plata',   precioUnitario: 3200.00 },
  { numeroSerie: 'TRN-002', nombre: 'Aceite ATF Dexron VI (1L)',        marca: 'Mobil',    modelo: 'ATF 3309',    color: 'Rojo',    precioUnitario: 185.00 },
  { numeroSerie: 'TRN-003', nombre: 'Semieje Izquierdo Cardone',        marca: 'Cardone',  modelo: '66-2163',     color: 'Negro',   precioUnitario: 1450.00 },
  // Carrocería / exterior
  { numeroSerie: 'CAR-001', nombre: 'Espejo Retrovisor Izq. Universal', marca: 'Depo',     modelo: '333-5401L3',  color: 'Negro',   precioUnitario: 890.00 },
  { numeroSerie: 'CAR-002', nombre: 'Manija Exterior Delantera Der.',   marca: 'Dorman',   modelo: '77002',       color: 'Negro',   precioUnitario: 320.00 },
  { numeroSerie: 'CAR-003', nombre: 'Faro Delantero Der. TYC',          marca: 'TYC',      modelo: '20-9172-00',  color: 'Claro',   precioUnitario: 1780.00 },
]

async function main() {
  console.log('🌱 Seed de sucursales Ometepec y Ayutla…\n')

  // ── Find branches ──────────────────────────────────────────────────────────
  const sucursales = await prisma.sucursal.findMany()
  const ayutla   = sucursales.find(s => s.nombre.toLowerCase().includes('ayutla'))
  const ometepec = sucursales.find(s => s.nombre.toLowerCase().includes('ometepec'))

  if (!ayutla)   throw new Error('No se encontró la sucursal Ayutla.')
  if (!ometepec) throw new Error('No se encontró la sucursal Ometepec.')

  console.log(`✓ Sucursales: ${ayutla.nombre} (id=${ayutla.id}), ${ometepec.nombre} (id=${ometepec.id})`)

  // ── Upsert products ────────────────────────────────────────────────────────
  console.log('\n📦 Creando productos…')
  const productos: { id: number; precioUnitario: number }[] = []

  for (const p of PRODUCTOS_NUEVOS) {
    const { numeroSerie, nombre, marca, modelo, color, precioUnitario } = p
    const prod = await prisma.producto.upsert({
      where:  { numeroSerie },
      update: {},
      create: { numeroSerie, nombre, marca, modelo, color, precioUnitario, activo: true },
    })
    productos.push({ id: prod.id, precioUnitario: Number(prod.precioUnitario) })
  }
  console.log(`  ✓ ${productos.length} productos`)

  // ── Set inventory for both branches ───────────────────────────────────────
  console.log('\n🏪 Asignando inventario…')

  for (const sucursal of [ayutla, ometepec]) {
    let count = 0
    for (const p of productos) {
      await prisma.inventarioSucursal.upsert({
        where:  { productoId_sucursalId: { productoId: p.id, sucursalId: sucursal.id } },
        update: {},
        create: { productoId: p.id, sucursalId: sucursal.id, stock: rand(5, 20) },
      })
      count++
    }
    console.log(`  ✓ ${count} productos con stock → ${sucursal.nombre}`)
  }

  // ── Fetch sellers per branch ───────────────────────────────────────────────
  const allUsers = await prisma.usuario.findMany({ where: { activo: true } })

  function vendedoresDe(sucursalId: number) {
    const propios = allUsers.filter(u => u.sucursalId === sucursalId)
    return propios.length ? propios : allUsers
  }

  // ── Historical sales: last 30 days ────────────────────────────────────────
  console.log('\n📊 Creando historial de ventas (últimos 30 días)…')

  for (const sucursal of [ayutla, ometepec]) {
    const vendedores = vendedoresDe(sucursal.id)
    let count = 0

    for (let i = 0; i < 60; i++) {
      const usuario    = pick(vendedores)
      const metodoPago = pick(METODOS)
      const fecha      = randomDateLastDays(30)
      const numItems   = rand(1, 4)
      const items      = [...productos].sort(() => Math.random() - 0.5).slice(0, numItems)
        .map(p => ({ productoId: p.id, cantidad: rand(1, 3), precioUnit: p.precioUnitario }))

      const subtotal    = items.reduce((s, i) => s + i.precioUnit * i.cantidad, 0)
      const totalConIva = subtotal * (1 + IVA / 100)

      await prisma.venta.create({
        data: {
          fecha, sucursalId: sucursal.id, usuarioId: usuario.id,
          metodoPago, subtotal, ivaPorcentaje: IVA, totalConIva,
          detalles: { create: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnit: i.precioUnit, subtotal: i.precioUnit * i.cantidad })) },
        },
      })
      count++
    }
    console.log(`  ✓ ${count} ventas históricas → ${sucursal.nombre}`)
  }

  // ── Today's sales ─────────────────────────────────────────────────────────
  console.log('\n🕐 Creando ventas de hoy…')

  for (const sucursal of [ayutla, ometepec]) {
    const vendedores = vendedoresDe(sucursal.id)
    const numVentas  = rand(6, 12)
    let count = 0

    for (let i = 0; i < numVentas; i++) {
      const usuario    = pick(vendedores)
      const metodoPago = pick(METODOS)
      const fecha      = randomTimeToday()
      const numItems   = rand(1, 3)
      const items      = [...productos].sort(() => Math.random() - 0.5).slice(0, numItems)
        .map(p => ({ productoId: p.id, cantidad: rand(1, 2), precioUnit: p.precioUnitario }))

      const subtotal    = items.reduce((s, i) => s + i.precioUnit * i.cantidad, 0)
      const totalConIva = subtotal * (1 + IVA / 100)

      await prisma.venta.create({
        data: {
          fecha, sucursalId: sucursal.id, usuarioId: usuario.id,
          metodoPago, subtotal, ivaPorcentaje: IVA, totalConIva,
          detalles: { create: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnit: i.precioUnit, subtotal: i.precioUnit * i.cantidad })) },
        },
      })
      count++
    }
    console.log(`  ✓ ${count} ventas de hoy → ${sucursal.nombre}`)
  }

  console.log('\n🎉 ¡Listo!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
