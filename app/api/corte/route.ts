import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const user = token ? await verifyToken(token) : null
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const sucursalId: number = body.sucursalId ? Number(body.sucursalId) : (user.sucursalId ?? 0)
    const gastosInput: { descripcion: string; monto: number }[] = Array.isArray(body.gastos) ? body.gastos.filter((g: { descripcion?: string; monto?: number }) => g.descripcion?.trim() && Number(g.monto) > 0) : []

    if (!sucursalId) return NextResponse.json({ error: 'Sucursal requerida' }, { status: 400 })

    if (user.rol === 'cajero' && user.sucursalId !== sucursalId) {
      return NextResponse.json({ error: 'Sin acceso a esa sucursal' }, { status: 403 })
    }

    // Use Mexico City timezone so "today" matches the user's local date
    const mxNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const hoyInicio = new Date(mxNow); hoyInicio.setHours(0, 0, 0, 0)
    const hoyFin    = new Date(mxNow); hoyFin.setHours(23, 59, 59, 999)
    const offset = mxNow.getTime() - new Date().getTime()
    const hoyInicioUTC = new Date(hoyInicio.getTime() - offset)
    const hoyFinUTC    = new Date(hoyFin.getTime() - offset)

    const ventas = await prisma.venta.findMany({
      where: { sucursalId, corteId: null, fecha: { gte: hoyInicioUTC, lte: hoyFinUTC } },
      select: { id: true, metodoPago: true, subtotal: true, totalConIva: true },
    })

    if (ventas.length === 0) {
      return NextResponse.json({ error: 'No hay ventas pendientes de corte para esta sucursal' }, { status: 422 })
    }

    const totalEfectivo      = ventas.filter(v => v.metodoPago === 'efectivo').reduce((s, v) => s + Number(v.totalConIva), 0)
    const totalTransferencia = ventas.filter(v => v.metodoPago === 'transferencia').reduce((s, v) => s + Number(v.totalConIva), 0)
    const subtotal           = ventas.reduce((s, v) => s + Number(v.subtotal), 0)
    const totalConIva        = ventas.reduce((s, v) => s + Number(v.totalConIva), 0)
    const totalIva           = totalConIva - subtotal

    const today = new Date(hoyInicio)

    const existing = await prisma.corteCaja.findUnique({
      where: { fecha_sucursalId: { fecha: today, sucursalId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un corte de caja para hoy en esta sucursal' }, { status: 409 })
    }

    const totalGastos = gastosInput.reduce((s, g) => s + Number(g.monto), 0)

    const corte = await prisma.$transaction(async (tx) => {
      const corte = await tx.corteCaja.create({
        data: { fecha: today, sucursalId, usuarioId: user.userId, cantidadVentas: ventas.length, totalEfectivo, totalTransferencia, subtotal, totalIva, totalConIva, totalGastos },
      })
      await tx.venta.updateMany({
        where: { id: { in: ventas.map(v => v.id) } },
        data: { corteId: corte.id },
      })
      if (gastosInput.length > 0) {
        await tx.gastoCaja.createMany({
          data: gastosInput.map(g => ({ corteId: corte.id, descripcion: g.descripcion.trim(), monto: Number(g.monto) })),
        })
      }
      return corte
    })

    return NextResponse.json({ id: corte.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/corte]', err)
    return NextResponse.json({ error: 'Error al procesar el corte' }, { status: 500 })
  }
}

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

    if (!sucursalId) return NextResponse.json([], { status: 200 })

    if (user.rol === 'cajero' && user.sucursalId !== sucursalId) {
      return NextResponse.json({ error: 'Sin acceso a esa sucursal' }, { status: 403 })
    }

    const cortes = await prisma.corteCaja.findMany({
      where: { sucursalId },
      orderBy: { fecha: 'desc' },
      take: 30,
      include: {
        usuario:  { select: { nombre: true, apellido: true } },
        sucursal: { select: { nombre: true } },
        gastos:   true,
      },
    })

    return NextResponse.json(cortes)
  } catch (err) {
    console.error('[GET /api/corte]', err)
    return NextResponse.json({ error: 'Error al obtener cortes' }, { status: 500 })
  }
}
