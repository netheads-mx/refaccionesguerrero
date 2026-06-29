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
    const modeloId = request.nextUrl.searchParams.get('modeloId')
    const versiones = await prisma.versionAuto.findMany({
      where: modeloId ? { modeloId: Number(modeloId) } : undefined,
      orderBy: [{ anioInicio: 'asc' }, { nombre: 'asc' }],
    })
    return NextResponse.json(versiones)
  } catch (err) {
    console.error('[GET /api/admin/autos/versiones]', err)
    return NextResponse.json({ error: 'Error al obtener versiones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { nombre, modeloId, anioInicio, anioFin, motor, transmision } = await request.json()
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (!modeloId) return NextResponse.json({ error: 'Modelo requerido' }, { status: 400 })
    if (!anioInicio) return NextResponse.json({ error: 'Año de inicio requerido' }, { status: 400 })

    const version = await prisma.versionAuto.create({
      data: {
        nombre: nombre.trim(),
        modeloId: Number(modeloId),
        anioInicio: Number(anioInicio),
        anioFin: anioFin ? Number(anioFin) : null,
        motor: motor?.trim() || null,
        transmision: transmision?.trim() || null,
      },
    })
    return NextResponse.json(version, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/autos/versiones]', err)
    return NextResponse.json({ error: 'Error al crear versión' }, { status: 500 })
  }
}
