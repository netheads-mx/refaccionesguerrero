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

    const { nombre } = await request.json()
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const modelo = await prisma.modeloAuto.update({
      where: { id: numId },
      data: { nombre: nombre.trim() },
      include: { _count: { select: { versiones: true } } },
    })
    return NextResponse.json(modelo)
  } catch (err) {
    console.error('[PATCH /api/admin/autos/modelos/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar modelo' }, { status: 500 })
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

    await prisma.versionAuto.deleteMany({ where: { modeloId: numId } })
    await prisma.modeloAuto.delete({ where: { id: numId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/autos/modelos/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar modelo' }, { status: 500 })
  }
}
