import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface QuoteItem {
  productoId: number
  cantidad: number
  precioUnit: number
  subtotal: number
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await verifyToken(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { items, sucursalId: bodySucursalId, nombreCliente } = (await request.json()) as {
    items: QuoteItem[]
    sucursalId?: number
    nombreCliente?: string
  }

  const cotizacionSucursalId = user.rol === 'administrador'
    ? (bodySucursalId ?? user.sucursalId ?? null)
    : (user.sucursalId ?? null)

  if (!items?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (!cotizacionSucursalId) {
    return NextResponse.json({ error: 'Debes seleccionar una sucursal' }, { status: 400 })
  }

  try {
    const total = items.reduce((s, i) => s + i.subtotal, 0)

    const cotizacion = await prisma.cotizacion.create({
      data: {
        sucursalId: cotizacionSucursalId,
        usuarioId: user.userId,
        nombreCliente: nombreCliente?.trim() || null,
        total,
        detalles: {
          create: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnit: i.precioUnit,
            subtotal: i.subtotal,
          })),
        },
      },
    })

    return NextResponse.json({ id: cotizacion.id, total: cotizacion.total })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear la cotización'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Admins see all quotes; managers and cajeros only see their branch
  const where = user.rol === 'administrador'
    ? {}
    : { sucursalId: user.sucursalId ?? -1 }

  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    orderBy: { fecha: 'desc' },
    include: {
      usuario: { select: { nombre: true, apellido: true } },
      sucursal: { select: { nombre: true } },
      detalles: { include: { producto: { select: { nombre: true, numeroSerie: true } } } },
    },
  })
  return NextResponse.json(cotizaciones)
}
