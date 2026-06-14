import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

const METODOS: ('efectivo' | 'transferencia')[] = ['efectivo', 'transferencia']
const IVA = 16

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Random time today between 09:00 and 19:00 */
function todayAt(hour: number, minute: number): Date {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d
}

function randomTimeToday(): Date {
  return todayAt(rand(9, 18), rand(0, 59))
}

async function main() {
  console.log('🌱 Seeding ventas de hoy…')

  const [sucursales, usuarios, productos] = await Promise.all([
    prisma.sucursal.findMany(),
    prisma.usuario.findMany({ where: { activo: true } }),
    prisma.producto.findMany({
      where: { activo: true },
      include: { inventario: { where: { stock: { gt: 0 } }, select: { sucursalId: true, stock: true } } },
    }),
  ])

  if (!sucursales.length) throw new Error('No hay sucursales.')
  if (!usuarios.length)   throw new Error('No hay usuarios.')
  if (!productos.length)  throw new Error('No hay productos con stock.')

  const productosPorSucursal = new Map<number, typeof productos>()
  for (const s of sucursales) {
    productosPorSucursal.set(s.id, productos.filter(p => p.inventario.some(i => i.sucursalId === s.id)))
  }

  let total = 0

  for (const sucursal of sucursales) {
    const disponibles = productosPorSucursal.get(sucursal.id) ?? []
    if (!disponibles.length) {
      console.log(`  ⚠ Sucursal "${sucursal.nombre}" sin stock disponible, se omite.`)
      continue
    }

    const vendedores = usuarios.filter(u => u.sucursalId === sucursal.id)
    const pool = vendedores.length ? vendedores : usuarios

    const numVentas = rand(4, 8)

    for (let i = 0; i < numVentas; i++) {
      const usuario    = pick(pool)
      const metodoPago = pick(METODOS)
      const fecha      = randomTimeToday()

      const numItems = rand(1, Math.min(3, disponibles.length))
      const items = [...disponibles]
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems)
        .map(p => ({ productoId: p.id, cantidad: rand(1, 2), precioUnit: Number(p.precioUnitario) }))

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
      total++
    }

    console.log(`  ✓ ${numVentas} ventas → ${sucursal.nombre}`)
  }

  console.log(`\n✅ ${total} ventas de hoy creadas en ${sucursales.length} sucursales.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
