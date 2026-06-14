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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const sucursales = await prisma.sucursal.findMany({ orderBy: { nombre: 'asc' } })
    return NextResponse.json(sucursales)
  } catch (err) {
    console.error('[GET /api/admin/sucursales]', err)
    return NextResponse.json({ error: 'Error al obtener sucursales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Only administrators can create branches
  if (user.rol !== 'administrador') {
    return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { nombre, direccion } = body

    if (!nombre?.trim())    return NextResponse.json({ error: 'Nombre requerido' },    { status: 400 })
    if (!direccion?.trim()) return NextResponse.json({ error: 'Dirección requerida' }, { status: 400 })

    const existing = await prisma.sucursal.findFirst({ where: { nombre: { equals: nombre.trim(), mode: 'insensitive' } } })
    if (existing) return NextResponse.json({ error: 'Ya existe una sucursal con ese nombre' }, { status: 409 })

    const sucursal = await prisma.sucursal.create({
      data: { nombre: nombre.trim(), direccion: direccion.trim() },
    })
    return NextResponse.json(sucursal, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/sucursales]', err)
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 })
  }
}
