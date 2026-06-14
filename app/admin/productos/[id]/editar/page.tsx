import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductoForm, type ProductoFormData } from '../../ProductoForm'

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId  = Number(id)
  if (isNaN(numId)) notFound()

  const [producto, sucursales] = await Promise.all([
    prisma.producto.findUnique({
      where: { id: numId },
      include: {
        inventario: {
          include: { sucursal: { select: { id: true, nombre: true } } },
          orderBy: { sucursal: { nombre: 'asc' } },
        },
      },
    }),
    prisma.sucursal.findMany({ orderBy: { nombre: 'asc' } }),
  ])

  if (!producto) notFound()

  const initial: ProductoFormData = {
    numeroSerie:    producto.numeroSerie,
    nombre:         producto.nombre,
    descripcion:    producto.descripcion    ?? '',
    marca:          producto.marca          ?? '',
    modelo:         producto.modelo         ?? '',
    color:          producto.color          ?? '',
    detalles:       producto.detalles       ?? '',
    anioInicio:     producto.anioInicio ? String(producto.anioInicio) : '',
    anioFin:        producto.anioFin   ? String(producto.anioFin)    : '',
    precioUnitario: String(producto.precioUnitario),
    inventario: sucursales.map(s => {
      const inv = producto.inventario.find(i => i.sucursalId === s.id)
      return { sucursalId: s.id, stock: inv?.stock ?? 0 }
    }),
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '13px', color: '#8896B3' }}>
        <Link href="/admin/productos" style={{ color: '#8896B3', textDecoration: 'none' }}>
          Productos
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span style={{ color: '#E8EDFF' }}>{producto.nombre}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
          Editar producto
        </h1>
        <p style={{ fontSize: '13px', color: '#8896B3', marginTop: '4px' }}>
          N° de serie: <code style={{ fontFamily: 'monospace', color: '#F59E0B' }}>{producto.numeroSerie}</code>
        </p>
      </div>

      <ProductoForm sucursales={sucursales} initial={initial} editId={numId} />
    </div>
  )
}
