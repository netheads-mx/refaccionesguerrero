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

export async function GET(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl
    const q        = searchParams.get('q')?.trim() ?? ''
    const page      = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limitParam = Number(searchParams.get('limit'))
    const limit      = [10, 20, 50, 100].includes(limitParam) ? limitParam : 20
    const activoParam  = searchParams.get('activo')
    const activoFilter = activoParam === null ? undefined : activoParam === 'true'

    const sucursalId = searchParams.get('sucursalId')

    const where = {
      ...(activoFilter !== undefined ? { activo: activoFilter } : {}),
      ...(sucursalId ? { inventario: { some: { sucursalId: Number(sucursalId) } } } : {}),
      ...(q ? {
        OR: [
          { nombre:      { contains: q, mode: 'insensitive' as const } },
          { numeroSerie: { contains: q, mode: 'insensitive' as const } },
          { marca:       { contains: q, mode: 'insensitive' as const } },
          { modelo:      { contains: q, mode: 'insensitive' as const } },
          { color:       { contains: q, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [total, data] = await Promise.all([
      prisma.producto.count({ where }),
      prisma.producto.findMany({
        where,
        include: inventarioInclude,
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET /api/admin/productos]', err)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { numeroSerie, nombre, descripcion, marca, modelo, color, detalles, anioInicio, anioFin, precioUnitario, inventario } = body

    if (!numeroSerie?.trim())  return NextResponse.json({ error: 'Número de serie requerido' }, { status: 400 })
    if (!nombre?.trim())       return NextResponse.json({ error: 'Nombre requerido' },           { status: 400 })
    if (precioUnitario == null || Number(precioUnitario) < 0)
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    if (!Array.isArray(inventario) || inventario.length === 0)
      return NextResponse.json({ error: 'Debe especificar stock para al menos una sucursal' }, { status: 400 })

    const existing = await prisma.producto.findUnique({ where: { numeroSerie: numeroSerie.trim() } })
    if (existing) return NextResponse.json({ error: 'Ya existe un producto con ese número de serie' }, { status: 409 })

    const producto = await prisma.producto.create({
      data: {
        numeroSerie:    numeroSerie.trim(),
        nombre:         nombre.trim(),
        descripcion:    descripcion?.trim() || null,
        marca:          marca?.trim()       || null,
        modelo:         modelo?.trim()      || null,
        color:          color?.trim()       || null,
        detalles:       detalles?.trim()    || null,
        anioInicio:     anioInicio ? Number(anioInicio) : null,
        anioFin:        anioFin    ? Number(anioFin)    : null,
        precioUnitario: Number(precioUnitario),
        inventario: {
          create: inventario.map((i: { sucursalId: number; stock: number }) => ({
            sucursalId: Number(i.sucursalId),
            stock:      Math.max(0, Number(i.stock ?? 0)),
          })),
        },
      },
      include: inventarioInclude,
    })
    return NextResponse.json(producto, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/productos]', err)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
