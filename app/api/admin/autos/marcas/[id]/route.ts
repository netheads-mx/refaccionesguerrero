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

    const { nombre, pais } = await request.json()
    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const marca = await prisma.marcaAuto.update({
      where: { id: numId },
      data: { nombre: nombre.trim(), pais: pais?.trim() || null },
    })
    return NextResponse.json(marca)
  } catch (err) {
    console.error('[PATCH /api/admin/autos/marcas/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar marca' }, { status: 500 })
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

    const modelos = await prisma.modeloAuto.findMany({ where: { marcaId: numId }, select: { id: true } })
    const modeloIds = modelos.map((m: { id: number }) => m.id)
    await prisma.versionAuto.deleteMany({ where: { modeloId: { in: modeloIds } } })
    await prisma.modeloAuto.deleteMany({ where: { marcaId: numId } })
    await prisma.marcaAuto.delete({ where: { id: numId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/autos/marcas/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar marca' }, { status: 500 })
  }
}
