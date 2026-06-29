import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@/app/generated/prisma/client/client'

interface CartItem {
  productoId: number
  nombre: string
  precioUnitario: number
  cantidad: number
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await verifyToken(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { items, metodoPago, claveRastreo, sucursalId: bodySucursalId } = (await request.json()) as {
    items: CartItem[]
    metodoPago: 'efectivo' | 'transferencia'
    claveRastreo?: string
    sucursalId?: number
  }

  // Resolve which branch this sale belongs to
  // Administrators can override the branch via the body; others always use their assigned branch
  const ventaSucursalId = user.rol === 'administrador'
    ? (bodySucursalId ?? user.sucursalId ?? null)
    : (user.sucursalId ?? null)

  if (!items?.length || !metodoPago) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (!ventaSucursalId) {
    return NextResponse.json({ error: 'Debes seleccionar una sucursal para procesar la venta' }, { status: 400 })
  }

  try {
    const venta = await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      // Validate stock in the sale's branch
      for (const item of items) {
        const inv = await tx.inventarioSucursal.findUnique({
          where: {
            productoId_sucursalId: {
              productoId: item.productoId,
              sucursalId: ventaSucursalId,
            },
          },
        })
        if (!inv || inv.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para "${item.nombre}"`)
        }
      }

      const subtotal   = items.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0)
      const ivaPct     = 0
      const totalConIva = subtotal

      const venta = await tx.venta.create({
        data: {
          sucursalId:   ventaSucursalId,
          usuarioId:    user.userId,
          metodoPago,
          claveRastreo: metodoPago === 'transferencia' ? (claveRastreo?.trim() || null) : null,
          subtotal,
          ivaPorcentaje: ivaPct,
          totalConIva,
          detalles: {
            create: items.map((i) => ({
              productoId: i.productoId,
              cantidad:   i.cantidad,
              precioUnit: i.precioUnitario,
              subtotal:   i.precioUnitario * i.cantidad,
            })),
          },
        },
      })

      // Decrement stock in the branch inventory
      for (const item of items) {
        await tx.inventarioSucursal.update({
          where: {
            productoId_sucursalId: {
              productoId: item.productoId,
              sucursalId: ventaSucursalId,
            },
          },
          data: { stock: { decrement: item.cantidad } },
        })
      }

      return venta
    })

    return NextResponse.json({ id: venta.id, totalConIva: venta.totalConIva })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar la venta'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ventas = await prisma.venta.findMany({
    take: 20,
    orderBy: { fecha: 'desc' },
    include: {
      usuario:  { select: { nombre: true, apellido: true } },
      sucursal: { select: { nombre: true } },
      detalles: { include: { producto: { select: { nombre: true } } } },
    },
  })
  return NextResponse.json(ventas)
}
