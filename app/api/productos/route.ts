import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Resolve the cashier's branch from their JWT
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user  = token ? await verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const sucursalId = user?.sucursalId

  const { searchParams } = request.nextUrl
  const q = searchParams.get('q')?.trim() ?? ''

  // Only administrators can override the branch filter via ?sucursalId=
  const qSucursalId = searchParams.get('sucursalId')
  const effectiveSucursalId: number | null =
    (user.rol === 'administrador' && qSucursalId) ? Number(qSucursalId) : sucursalId ?? null

  // Filters by brand, model, and year
  const fMarca  = searchParams.get('marca')?.trim()  || undefined
  const fModelo = searchParams.get('modelo')?.trim() || undefined
  const fAnio   = searchParams.get('anio')            ? Number(searchParams.get('anio')) : undefined

  // Build AND conditions to avoid OR key conflicts
  const andConditions: Record<string, unknown>[] = []

  if (q) {
    andConditions.push({
      OR: [
        { nombre:      { contains: q, mode: 'insensitive' } },
        { numeroSerie: { contains: q, mode: 'insensitive' } },
        { marca:       { contains: q, mode: 'insensitive' } },
        { modelo:      { contains: q, mode: 'insensitive' } },
      ],
    })
  }
  if (fMarca)  andConditions.push({ marca:  { equals: fMarca,  mode: 'insensitive' } })
  if (fModelo) andConditions.push({ modelo: { equals: fModelo, mode: 'insensitive' } })
  if (fAnio) {
    andConditions.push({
      anioInicio: { lte: fAnio },
      OR: [{ anioFin: { gte: fAnio } }, { anioFin: null }],
    })
  }

  const where = {
    activo: true,
    ...(effectiveSucursalId
      ? { inventario: { some: { sucursalId: effectiveSucursalId, stock: { gt: 0 } } } }
      : { inventario: { some: { stock: { gt: 0 } } } }),
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  }

  const productos = await prisma.producto.findMany({
    where,
    take: 60,
    orderBy: { nombre: 'asc' },
    include: {
      inventario: effectiveSucursalId
        ? { where: { sucursalId: effectiveSucursalId }, select: { stock: true, sucursal: { select: { nombre: true } } } }
        : { select: { stock: true, sucursalId: true, sucursal: { select: { nombre: true } } } },
    },
  })

  // Flatten: expose branch-specific stock at the top level for the POS UI
  const data = productos.map(p => ({
    id:             p.id,
    numeroSerie:    p.numeroSerie,
    nombre:         p.nombre,
    descripcion:    p.descripcion,
    marca:          p.marca,
    modelo:         p.modelo,
    color:          p.color,
    precioUnitario: Number(p.precioUnitario),
    stock: effectiveSucursalId
      ? (p.inventario[0]?.stock ?? 0)
      : p.inventario.reduce((s: number, i: { stock: number }) => s + i.stock, 0),
    sucursal: { nombre: p.inventario[0]?.sucursal?.nombre ?? 'Sin sucursal' },
    otherBranch: false,
    otherBranchNombre: null as string | null,
  }))

  // When searching with a branch filter, also look for matching products
  // available in OTHER branches (not in the cashier's branch)
  let otherBranchData: typeof data = []
  const hasFilters = q || fMarca || fModelo || fAnio
  if (effectiveSucursalId && hasFilters) {
    const localIds = new Set(data.map(p => p.id))

    const otherProducts = await prisma.producto.findMany({
      where: {
        activo: true,
        id: { notIn: localIds.size > 0 ? [...localIds] : [0] },
        inventario: {
          some: { stock: { gt: 0 }, sucursalId: { not: effectiveSucursalId } },
        },
        ...(andConditions.length > 0 ? { AND: andConditions } : {}),
      },
      take: 20,
      orderBy: { nombre: 'asc' },
      include: {
        inventario: {
          where: { stock: { gt: 0 }, sucursalId: { not: effectiveSucursalId } },
          select: { stock: true, sucursal: { select: { nombre: true } } },
          take: 1,
        },
      },
    })

    otherBranchData = otherProducts.map(p => ({
      id:             p.id,
      numeroSerie:    p.numeroSerie,
      nombre:         p.nombre,
      descripcion:    p.descripcion,
      marca:          p.marca,
      modelo:         p.modelo,
      color:          p.color,
      precioUnitario: Number(p.precioUnitario),
      stock:          p.inventario[0]?.stock ?? 0,
      sucursal:       { nombre: p.inventario[0]?.sucursal?.nombre ?? 'Otra sucursal' },
      otherBranch:    true,
      otherBranchNombre: p.inventario[0]?.sucursal?.nombre ?? 'Otra sucursal',
    }))
  }

  return NextResponse.json([...data, ...otherBranchData])
}
