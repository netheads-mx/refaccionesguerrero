import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdministrador() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user || user.rol !== 'administrador') return null
  return user
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdministrador()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId || isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const { nombre, direccion } = body

    if (!nombre?.trim())    return NextResponse.json({ error: 'Nombre requerido' },    { status: 400 })
    if (!direccion?.trim()) return NextResponse.json({ error: 'Dirección requerida' }, { status: 400 })

    const duplicate = await prisma.sucursal.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: 'insensitive' }, NOT: { id: numId } },
    })
    if (duplicate) return NextResponse.json({ error: 'Ya existe una sucursal con ese nombre' }, { status: 409 })

    const sucursal = await prisma.sucursal.update({
      where: { id: numId },
      data: { nombre: nombre.trim(), direccion: direccion.trim() },
    })
    return NextResponse.json(sucursal)
  } catch (err) {
    console.error('[PATCH /api/admin/sucursales/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar sucursal' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdministrador()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId || isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const [usuarios, inventario, ventas] = await Promise.all([
      prisma.usuario.count({ where: { sucursalId: numId } }),
      prisma.inventarioSucursal.count({ where: { sucursalId: numId } }),
      prisma.venta.count({ where: { sucursalId: numId } }),
    ])

    if (usuarios > 0)   return NextResponse.json({ error: `No se puede eliminar: tiene ${usuarios} usuario${usuarios !== 1 ? 's' : ''} asignado${usuarios !== 1 ? 's' : ''}` }, { status: 409 })
    if (ventas > 0)     return NextResponse.json({ error: `No se puede eliminar: tiene ${ventas} venta${ventas !== 1 ? 's' : ''} registrada${ventas !== 1 ? 's' : ''}` }, { status: 409 })
    if (inventario > 0) return NextResponse.json({ error: 'No se puede eliminar: tiene productos en inventario' }, { status: 409 })

    await prisma.sucursal.delete({ where: { id: numId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/sucursales/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar sucursal' }, { status: 500 })
  }
}
