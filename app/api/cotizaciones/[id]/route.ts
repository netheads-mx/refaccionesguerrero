import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await verifyToken(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const cotizacionId = Number(id)
  if (isNaN(cotizacionId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    // Non-admins can only delete quotes from their own branch
    if (user.rol !== 'administrador') {
      const cotizacion = await prisma.cotizacion.findUnique({ where: { id: cotizacionId } })
      if (!cotizacion || cotizacion.sucursalId !== user.sucursalId) {
        return NextResponse.json({ error: 'No autorizado para eliminar esta cotización' }, { status: 403 })
      }
    }
    await prisma.cotizacion.delete({ where: { id: cotizacionId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudo eliminar la cotización' }, { status: 422 })
  }
}
