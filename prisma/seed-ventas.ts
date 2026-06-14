import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const METODOS: ('efectivo' | 'tarjeta' | 'transferencia')[] = ['efectivo', 'tarjeta', 'transferencia']
const IVA = 16

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
/** Random datetime within the last `days` days */
function randomDate(daysAgo: number): Date {
  const now  = Date.now()
  const from = now - daysAgo * 24 * 60 * 60 * 1000
  return new Date(from + Math.random() * (now - from))
}

async function main() {
  console.log('🌱 Seeding ventas…')

  const [sucursales, usuarios, productos] = await Promise.all([
    prisma.sucursal.findMany(),
    prisma.usuario.findMany({ where: { activo: true } }),
    prisma.producto.findMany({
      where: { activo: true },
      include: { inventario: { select: { sucursalId: true, stock: true } } },
    }),
  ])

  if (!sucursales.length) throw new Error('No hay sucursales. Ejecuta el seed principal primero.')
  if (!usuarios.length)   throw new Error('No hay usuarios. Ejecuta el seed principal primero.')
  if (!productos.length)  throw new Error('No hay productos. Ejecuta el seed principal primero.')

  // Build a map: sucursalId → products that have stock there
  const productosPorSucursal = new Map<number, typeof productos>()
  for (const s of sucursales) {
    const disponibles = productos.filter(p => p.inventario.some(i => i.sucursalId === s.id))
    productosPorSucursal.set(s.id, disponibles)
  }

  let totalVentas = 0

  // Create ~40 sales spread over the last 45 days
  for (let i = 0; i < 40; i++) {
    const sucursal = pick(sucursales)
    const disponibles = productosPorSucursal.get(sucursal.id) ?? []
    if (!disponibles.length) continue

    // Pick a seller from this branch (or any user if none assigned)
    const vendedores = usuarios.filter(u => u.sucursalId === sucursal.id)
    const usuario    = pick(vendedores.length ? vendedores : usuarios)

    const metodoPago = pick(METODOS)
    const fecha      = randomDate(45)

    // Pick 1–3 distinct products
    const numItems  = rand(1, Math.min(3, disponibles.length))
    const shuffled  = [...disponibles].sort(() => Math.random() - 0.5).slice(0, numItems)

    const items = shuffled.map(p => ({
      productoId: p.id,
      cantidad:   rand(1, 2),
      precioUnit: Number(p.precioUnitario),
    }))

    const subtotal    = items.reduce((s, i) => s + i.precioUnit * i.cantidad, 0)
    const totalConIva = subtotal * (1 + IVA / 100)

    await prisma.venta.create({
      data: {
        fecha,
        sucursalId:    sucursal.id,
        usuarioId:     usuario.id,
        metodoPago,
        subtotal,
        ivaPorcentaje: IVA,
        totalConIva,
        detalles: {
          create: items.map(i => ({
            productoId: i.productoId,
            cantidad:   i.cantidad,
            precioUnit: i.precioUnit,
            subtotal:   i.precioUnit * i.cantidad,
          })),
        },
      },
    })

    totalVentas++
  }

  console.log(`✓ ${totalVentas} ventas creadas con sus detalles`)
  console.log('🎉 Listo!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
