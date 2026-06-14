import { PrismaClient } from '../app/generated/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seeded sales have ivaPorcentaje = 16; real sales (after IVA removal) have 0
  const seeded = await prisma.venta.findMany({
    where: { ivaPorcentaje: { not: 0 } },
    select: { id: true },
  })

  const real = await prisma.venta.count({
    where: { ivaPorcentaje: 0 },
  })

  console.log(`Found ${seeded.length} seeded sales (IVA != 0) and ${real} real sales (IVA = 0)`)

  if (seeded.length === 0) {
    console.log('Nothing to delete.')
    return
  }

  const ids = seeded.map(v => v.id)

  // Delete details first (cascade should handle this, but be explicit)
  const deletedDetails = await prisma.ventaDetalle.deleteMany({
    where: { ventaId: { in: ids } },
  })
  console.log(`Deleted ${deletedDetails.count} sale details`)

  const deletedVentas = await prisma.venta.deleteMany({
    where: { id: { in: ids } },
  })
  console.log(`Deleted ${deletedVentas.count} seeded sales`)
  console.log(`Kept ${real} real sales`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
