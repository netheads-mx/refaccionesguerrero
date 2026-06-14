import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const inventarioInclude = {
  inventario: {
    include: { sucursal: { select: { id: true, nombre: true } } },
    orderBy: { sucursal: { nombre: 'asc' as const } },
  },
}

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

    const body = await request.json()
    const { nombre, descripcion, marca, modelo, color, detalles, anioInicio, anioFin, precioUnitario, activo, inventario } = body

    if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (precioUnitario == null || Number(precioUnitario) < 0)
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })

    await prisma.producto.update({
      where: { id: numId },
      data: {
        nombre:         nombre.trim(),
        descripcion:    descripcion?.trim()  || null,
        marca:          marca?.trim()        || null,
        modelo:         modelo?.trim()       || null,
        color:          color?.trim()        || null,
        detalles:       detalles?.trim()     || null,
        anioInicio:     anioInicio ? Number(anioInicio) : null,
        anioFin:        anioFin    ? Number(anioFin)    : null,
        precioUnitario: Number(precioUnitario),
        ...(activo !== undefined ? { activo } : {}),
      },
      include: inventarioInclude,
    })

    if (Array.isArray(inventario)) {
      await Promise.all(
        inventario.map((i: { sucursalId: number; stock: number }) =>
          prisma.inventarioSucursal.upsert({
            where: {
              productoId_sucursalId: {
                productoId: numId,
                sucursalId: Number(i.sucursalId),
              },
            },
            update: { stock: Math.max(0, Number(i.stock ?? 0)) },
            create: {
              productoId: numId,
              sucursalId: Number(i.sucursalId),
              stock:      Math.max(0, Number(i.stock ?? 0)),
            },
          })
        )
      )
    }

    const updated = await prisma.producto.findUnique({
      where: { id: numId },
      include: inventarioInclude,
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PATCH /api/admin/productos/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
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

    await prisma.producto.update({ where: { id: numId }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/productos/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}
