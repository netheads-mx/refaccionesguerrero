import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const user = token ? await verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = request.nextUrl
    const sucursalId = searchParams.get('sucursalId')
      ? Number(searchParams.get('sucursalId'))
      : user.sucursalId

    if (!sucursalId) return NextResponse.json({ error: 'Sucursal requerida' }, { status: 400 })

    if (user.rol === 'cajero' && user.sucursalId !== sucursalId) {
      return NextResponse.json({ error: 'Sin acceso a esa sucursal' }, { status: 403 })
    }

    const sucursal = await prisma.sucursal.findUnique({ where: { id: sucursalId } })
    if (!sucursal) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })

    const hoyInicio = new Date(); hoyInicio.setHours(0, 0, 0, 0)
    const hoyFin    = new Date(); hoyFin.setHours(23, 59, 59, 999)

    const ventas = await prisma.venta.findMany({
      where: { sucursalId, corteId: null, fecha: { gte: hoyInicio, lte: hoyFin } },
      orderBy: { fecha: 'asc' },
      select: {
        id: true, fecha: true, metodoPago: true, subtotal: true, ivaPorcentaje: true, totalConIva: true,
        usuario: { select: { nombre: true, apellido: true } },
        detalles: {
          select: {
            cantidad: true, precioUnit: true, subtotal: true,
            producto: { select: { nombre: true } },
          },
        },
      },
    })

    const totals = ventas.reduce(
      (acc, v) => {
        const sub   = Number(v.subtotal)
        const total = Number(v.totalConIva)
        return {
          count:         acc.count + 1,
          efectivo:      acc.efectivo      + (v.metodoPago === 'efectivo'      ? total : 0),
          transferencia: acc.transferencia + (v.metodoPago === 'transferencia' ? total : 0),
          subtotal:      acc.subtotal      + sub,
          totalIva:      acc.totalIva      + (total - sub),
          totalConIva:   acc.totalConIva   + total,
        }
      },
      { count: 0, efectivo: 0, transferencia: 0, subtotal: 0, totalIva: 0, totalConIva: 0 }
    )

    const ventasList = ventas.map(v => ({
      id:          v.id,
      hora:        new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      metodoPago:  v.metodoPago,
      subtotal:    Number(v.subtotal),
      totalIva:    Number(v.totalConIva) - Number(v.subtotal),
      totalConIva: Number(v.totalConIva),
      usuario:     `${v.usuario.nombre} ${v.usuario.apellido}`,
      detalles:    v.detalles.map(d => ({
        producto:   d.producto.nombre,
        cantidad:   d.cantidad,
        precioUnit: Number(d.precioUnit),
        subtotal:   Number(d.subtotal),
      })),
    }))

    return NextResponse.json({ sucursalNombre: sucursal.nombre, ventas: ventasList, totals, hasSales: ventas.length > 0 })
  } catch (err) {
    console.error('[GET /api/corte/preview]', err)
    return NextResponse.json({ error: 'Error al obtener el corte' }, { status: 500 })
  }
}
