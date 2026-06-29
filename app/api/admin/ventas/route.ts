import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const user = token ? await verifyToken(token) : null
    if (!user || user.rol === 'cajero') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const page  = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = [10, 20, 50, 100].includes(Number(searchParams.get('limit')))
      ? Number(searchParams.get('limit'))
      : 20
    const metodoPago  = searchParams.get('metodoPago') ?? ''
    const sucursalId  = searchParams.get('sucursalId') ?? ''
    const fechaDesde  = searchParams.get('fechaDesde') ?? ''
    const fechaHasta  = searchParams.get('fechaHasta') ?? ''

    const where: Record<string, unknown> = {}
    if (metodoPago)  where.metodoPago  = metodoPago
    if (sucursalId)  where.sucursalId  = Number(sucursalId)
    if (fechaDesde || fechaHasta) {
      where.fecha = {
        ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
        ...(fechaHasta ? { lte: new Date(fechaHasta + 'T23:59:59') } : {}),
      }
    }

    const [total, data] = await Promise.all([
      prisma.venta.count({ where }),
      prisma.venta.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          usuario:  { select: { id: true, nombre: true, apellido: true } },
          sucursal: { select: { id: true, nombre: true } },
          detalles: {
            include: { producto: { select: { id: true, nombre: true, numeroSerie: true } } },
          },
        },
      }),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET /api/admin/ventas]', err)
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
}
