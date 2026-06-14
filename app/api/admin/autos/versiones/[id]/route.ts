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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId || isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const { nombre, anioInicio, anioFin, motor, transmision } = await request.json()
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (!anioInicio) return NextResponse.json({ error: 'Año de inicio requerido' }, { status: 400 })

    const version = await prisma.versionAuto.update({
      where: { id: numId },
      data: {
        nombre: nombre.trim(),
        anioInicio: Number(anioInicio),
        anioFin: anioFin ? Number(anioFin) : null,
        motor: motor?.trim() || null,
        transmision: transmision?.trim() || null,
      },
    })
    return NextResponse.json(version)
  } catch (err) {
    console.error('[PATCH /api/admin/autos/versiones/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar versión' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId || isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    await prisma.versionAuto.delete({ where: { id: numId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/autos/versiones/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar versión' }, { status: 500 })
  }
}
