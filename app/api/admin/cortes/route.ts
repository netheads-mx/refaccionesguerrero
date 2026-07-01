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
    const page       = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit      = [10, 20, 50].includes(Number(searchParams.get('limit'))) ? Number(searchParams.get('limit')) : 20
    const sucursalId = searchParams.get('sucursalId') ? Number(searchParams.get('sucursalId')) : undefined
    const desde      = searchParams.get('desde') ? new Date(searchParams.get('desde')!) : undefined
    const hasta      = searchParams.get('hasta') ? new Date(searchParams.get('hasta')!) : undefined

    // Managers only see their own branch
    const effectiveSucursalId = user.rol === 'manager' ? (user.sucursalId ?? undefined) : sucursalId

    const where = {
      ...(effectiveSucursalId ? { sucursalId: effectiveSucursalId } : {}),
      ...(desde || hasta ? { fecha: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } } : {}),
    }

    const [total, data] = await Promise.all([
      prisma.corteCaja.count({ where }),
      prisma.corteCaja.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sucursal: { select: { id: true, nombre: true } },
          usuario:  { select: { id: true, nombre: true, apellido: true } },
          gastos:   true,
        },
      }),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET /api/admin/cortes]', err)
    return NextResponse.json({ error: 'Error al obtener cortes' }, { status: 500 })
  }
}
