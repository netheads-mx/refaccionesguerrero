import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const productos = await prisma.producto.findMany({
    where: { activo: true, inventario: { some: { stock: { gt: 0 } } } },
    select: { marca: true, modelo: true, anioInicio: true, anioFin: true },
  })

  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean) as string[])].sort()
  const modelos = [...new Set(productos.map(p => p.modelo).filter(Boolean) as string[])].sort()

  // Collect all years from the ranges
  const yearsSet = new Set<number>()
  for (const p of productos) {
    if (p.anioInicio) {
      const end = p.anioFin ?? new Date().getFullYear()
      for (let y = p.anioInicio; y <= end; y++) {
        yearsSet.add(y)
      }
    }
  }
  const anios = [...yearsSet].sort((a, b) => b - a)

  return NextResponse.json({ marcas, modelos, anios })
}
