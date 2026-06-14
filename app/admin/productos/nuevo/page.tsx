import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProductoForm } from '../ProductoForm'

export default async function NuevoProductoPage() {
  const sucursales = await prisma.sucursal.findMany({ orderBy: { nombre: 'asc' } })

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
        <span style={{ color: '#E8EDFF' }}>Nuevo producto</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
          Nuevo producto
        </h1>
        <p style={{ fontSize: '13px', color: '#8896B3', marginTop: '4px' }}>
          Completa los campos para agregar un producto al catálogo.
        </p>
      </div>

      <ProductoForm sucursales={sucursales} />
    </div>
  )
}
