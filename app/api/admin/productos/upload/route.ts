import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user || user.rol === 'cajero') return null
  return user
}

interface UploadRow {
  serie: string
  cantidad: number
  nombre: string
  marca: string
  modelo: string
  precio: number
  desde: number
  hasta: number
  sucursal: string
}

interface RowResult {
  row: number
  serie: string
  status: 'ok' | 'error'
  error?: string
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { rows } = body as { rows: UploadRow[] }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No se recibieron filas' }, { status: 400 })
    }

    // Pre-load all brands with their models for validation
    const marcas = await prisma.marcaAuto.findMany({
      include: { modelos: { select: { nombre: true } } },
    })
    const marcaMap = new Map(
      marcas.map(m => [
        m.nombre.toLowerCase(),
        m.modelos.map(mod => mod.nombre.toLowerCase()),
      ])
    )

    // Pre-load all sucursales for validation
    const sucursales = await prisma.sucursal.findMany()
    const sucursalMap = new Map(
      sucursales.map(s => [s.nombre.toLowerCase(), s.id])
    )

    // Check for duplicate series within the file
    const seriesSeen = new Map<string, number>()

    const results: RowResult[] = []

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const rowNum = i + 2 // +2 because row 1 is the header in the spreadsheet

      // --- Validate all fields are non-empty ---
      const missing: string[] = []
      if (!r.serie || String(r.serie).trim() === '') missing.push('serie')
      if (r.cantidad == null || String(r.cantidad).trim() === '') missing.push('cantidad')
      if (!r.nombre || String(r.nombre).trim() === '') missing.push('nombre')
      if (!r.marca || String(r.marca).trim() === '') missing.push('marca')
      if (!r.modelo || String(r.modelo).trim() === '') missing.push('modelo')
      if (r.precio == null || String(r.precio).trim() === '') missing.push('precio')
      if (r.desde == null || String(r.desde).trim() === '') missing.push('desde')
      if (r.hasta == null || String(r.hasta).trim() === '') missing.push('hasta')
      if (!r.sucursal || String(r.sucursal).trim() === '') missing.push('sucursal')

      if (missing.length > 0) {
        results.push({ row: rowNum, serie: r.serie || '?', status: 'error', error: `Campos vacíos: ${missing.join(', ')}` })
        continue
      }

      const serie = String(r.serie).trim()
      const nombre = String(r.nombre).trim()
      const marca = String(r.marca).trim()
      const modelo = String(r.modelo).trim()
      const sucursalNombre = String(r.sucursal).trim()
      const cantidad = Number(r.cantidad)
      const precio = Number(r.precio)
      const desde = Number(r.desde)
      const hasta = Number(r.hasta)

      // --- Validate numeric values ---
      if (isNaN(cantidad) || cantidad < 0 || !Number.isInteger(cantidad)) {
        results.push({ row: rowNum, serie, status: 'error', error: 'Cantidad debe ser un número entero positivo' })
        continue
      }
      if (isNaN(precio) || precio < 0) {
        results.push({ row: rowNum, serie, status: 'error', error: 'Precio inválido' })
        continue
      }
      if (isNaN(desde) || !Number.isInteger(desde)) {
        results.push({ row: rowNum, serie, status: 'error', error: '"desde" debe ser un año válido' })
        continue
      }
      if (isNaN(hasta) || !Number.isInteger(hasta)) {
        results.push({ row: rowNum, serie, status: 'error', error: '"hasta" debe ser un año válido' })
        continue
      }

      // --- Validate desde <= hasta ---
      if (desde > hasta) {
        results.push({ row: rowNum, serie, status: 'error', error: `"desde" (${desde}) debe ser menor o igual que "hasta" (${hasta})` })
        continue
      }

      // --- Validate sucursal exists ---
      const sucursalId = sucursalMap.get(sucursalNombre.toLowerCase())
      if (!sucursalId) {
        results.push({ row: rowNum, serie, status: 'error', error: `Sucursal "${sucursalNombre}" no encontrada` })
        continue
      }

      // --- Validate brand/model match ---
      const marcaModelos = marcaMap.get(marca.toLowerCase())
      if (!marcaModelos) {
        results.push({ row: rowNum, serie, status: 'error', error: `Marca "${marca}" no encontrada en el catálogo` })
        continue
      }
      if (!marcaModelos.includes(modelo.toLowerCase())) {
        results.push({ row: rowNum, serie, status: 'error', error: `Modelo "${modelo}" no pertenece a la marca "${marca}"` })
        continue
      }

      // --- Validate duplicate series within file ---
      if (seriesSeen.has(serie.toLowerCase())) {
        results.push({ row: rowNum, serie, status: 'error', error: `Serie duplicada en el archivo (misma que fila ${seriesSeen.get(serie.toLowerCase())})` })
        continue
      }
      seriesSeen.set(serie.toLowerCase(), rowNum)

      // --- Validate serie doesn't already exist in DB ---
      const existing = await prisma.producto.findUnique({ where: { numeroSerie: serie } })
      if (existing) {
        results.push({ row: rowNum, serie, status: 'error', error: `Ya existe un producto con serie "${serie}"` })
        continue
      }

      // --- Create product ---
      try {
        await prisma.producto.create({
          data: {
            numeroSerie: serie,
            nombre,
            marca,
            modelo,
            precioUnitario: precio,
            anioInicio: desde,
            anioFin: hasta,
            inventario: {
              create: { sucursalId, stock: cantidad },
            },
          },
        })
        results.push({ row: rowNum, serie, status: 'ok' })
      } catch (err) {
        console.error(`[UPLOAD] Error creating product row ${rowNum}:`, err)
        results.push({ row: rowNum, serie, status: 'error', error: 'Error interno al crear producto' })
      }
    }

    const created = results.filter(r => r.status === 'ok').length
    const errors = results.filter(r => r.status === 'error').length

    return NextResponse.json({ results, summary: { total: rows.length, created, errors } })
  } catch (err) {
    console.error('[POST /api/admin/productos/upload]', err)
    return NextResponse.json({ error: 'Error al procesar archivo' }, { status: 500 })
  }
}
