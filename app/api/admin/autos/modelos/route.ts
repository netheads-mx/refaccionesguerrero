import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user || user.rol === 'cajero') return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const marcaId = request.nextUrl.searchParams.get('marcaId')
    const modelos = await prisma.modeloAuto.findMany({
      where: marcaId ? { marcaId: Number(marcaId) } : undefined,
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { versiones: true } } },
    })
    return NextResponse.json(modelos)
  } catch (err) {
    console.error('[GET /api/admin/autos/modelos]', err)
    return NextResponse.json({ error: 'Error al obtener modelos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { nombre, marcaId } = await request.json()
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (!marcaId) return NextResponse.json({ error: 'Marca requerida' }, { status: 400 })

    const modelo = await prisma.modeloAuto.create({
      data: { nombre: nombre.trim(), marcaId: Number(marcaId) },
      include: { _count: { select: { versiones: true } } },
    })
    return NextResponse.json(modelo, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/autos/modelos]', err)
    return NextResponse.json({ error: 'Error al crear modelo' }, { status: 500 })
  }
}
