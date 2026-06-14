import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@/app/generated/prisma/client/client'

export async function POST(
  request: NextRequest,
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

  const { metodoPago, claveRastreo } = (await request.json()) as {
    metodoPago: 'efectivo' | 'transferencia'
    claveRastreo?: string
  }

  if (!metodoPago) {
    return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 })
  }

  try {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { detalles: { include: { producto: true } } },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Non-admins can only convert quotes from their own branch
    if (user.rol !== 'administrador' && cotizacion.sucursalId !== user.sucursalId) {
      return NextResponse.json({ error: 'No autorizado para convertir esta cotización' }, { status: 403 })
    }

    const venta = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Validate stock
      for (const det of cotizacion.detalles) {
        const inv = await tx.inventarioSucursal.findUnique({
          where: {
            productoId_sucursalId: {
              productoId: det.productoId,
              sucursalId: cotizacion.sucursalId,
            },
          },
        })
        if (!inv || inv.stock < det.cantidad) {
          throw new Error(`Stock insuficiente para "${det.producto.nombre}"`)
        }
      }

      const subtotal = cotizacion.detalles.reduce(
        (s, d) => s + Number(d.precioUnit) * d.cantidad,
        0
      )

      const venta = await tx.venta.create({
        data: {
          sucursalId: cotizacion.sucursalId,
          usuarioId: user.userId,
          metodoPago,
          claveRastreo: metodoPago === 'transferencia' ? (claveRastreo?.trim() || null) : null,
          subtotal,
          ivaPorcentaje: 0,
          totalConIva: subtotal,
          detalles: {
            create: cotizacion.detalles.map((d) => ({
              productoId: d.productoId,
              cantidad: d.cantidad,
              precioUnit: d.precioUnit,
              subtotal: Number(d.precioUnit) * d.cantidad,
            })),
          },
        },
      })

      // Decrement stock
      for (const det of cotizacion.detalles) {
        await tx.inventarioSucursal.update({
          where: {
            productoId_sucursalId: {
              productoId: det.productoId,
              sucursalId: cotizacion.sucursalId,
            },
          },
          data: { stock: { decrement: det.cantidad } },
        })
      }

      // Delete the quote
      await tx.cotizacion.delete({ where: { id: cotizacionId } })

      return venta
    })

    return NextResponse.json({ id: venta.id, totalConIva: venta.totalConIva })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al convertir la cotización'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
