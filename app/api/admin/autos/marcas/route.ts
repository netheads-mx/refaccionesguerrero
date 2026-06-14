import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin(request?: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user || user.rol === 'cajero') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const marcas = await prisma.marcaAuto.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { modelos: true } } },
    })
    return NextResponse.json(marcas)
  } catch (err) {
    console.error('[GET /api/admin/autos/marcas]', err)
    return NextResponse.json({ error: 'Error al obtener marcas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { nombre, pais } = await request.json()
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const existing = await prisma.marcaAuto.findUnique({ where: { nombre: nombre.trim() } })
    if (existing) return NextResponse.json({ error: 'Ya existe una marca con ese nombre' }, { status: 409 })

    const marca = await prisma.marcaAuto.create({ data: { nombre: nombre.trim(), pais: pais?.trim() || null } })
    return NextResponse.json(marca, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/autos/marcas]', err)
    return NextResponse.json({ error: 'Error al crear marca' }, { status: 500 })
  }
}
