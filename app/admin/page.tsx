import Link from 'next/link'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

interface VentaRow {
  id: number
  fecha: Date
  metodoPago: string
  totalConIva: unknown
  usuario: { nombre: string; apellido: string }
  sucursal: { nombre: string }
  _count: { detalles: number }
}

interface ProductoSinStock {
  id: number
  nombre: string
  numeroSerie: string
  inventario: { stock: number; sucursal: { nombre: string } }[]
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

const metodoPagoLabel: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

export default async function AdminPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [productosSinStock, totalUsuarios, totalSucursales, ventasHoy, recentVentas] =
    await Promise.all([
      prisma.producto.findMany({
        where: { activo: true, inventario: { some: { stock: { lte: 0 } } } },
        select: {
          id: true,
          nombre: true,
          numeroSerie: true,
          inventario: {
            where: { stock: { lte: 0 } },
            select: { stock: true, sucursal: { select: { nombre: true } } },
            orderBy: { sucursal: { nombre: 'asc' } },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      prisma.usuario.count({ where: { activo: true } }),
      prisma.sucursal.count(),
      prisma.venta.aggregate({
        where: { fecha: { gte: today } },
        _sum: { totalConIva: true },
        _count: { id: true },
      }),
      prisma.venta.findMany({
        take: 10,
        orderBy: { fecha: 'desc' },
        include: {
          usuario: { select: { nombre: true, apellido: true } },
          sucursal: { select: { nombre: true } },
          _count: { select: { detalles: true } },
        },
      }),
    ])

  const ingresoHoy = Number(ventasHoy._sum.totalConIva ?? 0)
  const countHoy = ventasHoy._count.id
  const countSinStock = productosSinStock.length

  const stats = [
    {
      label: 'Sin stock',
      value: countSinStock.toLocaleString('es-MX'),
      danger: countSinStock > 0,
      href: '/admin/sin-stock',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          <line x1="12" y1="13" x2="12" y2="17"/><line x1="12" y1="21" x2="12.01" y2="21"/>
        </svg>
      ),
    },
    {
      label: 'Ventas hoy',
      value: countHoy.toLocaleString('es-MX'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
    },
    {
      label: 'Ingresos hoy',
      value: formatCurrency(ingresoHoy),
      highlight: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Sucursales',
      value: totalSucursales.toLocaleString('es-MX'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
    },
    {
      label: 'Usuarios activos',
      value: totalUsuarios.toLocaleString('es-MX'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ]

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  })()

  return (
    <div className="admin-page-content" style={{ padding: '36px 44px', maxWidth: '1200px' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '24px', height: '1px', background: '#FF4400' }} />
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF4400' }}>
            {greeting}
          </p>
        </div>
        <h1 className="admin-page-title" style={{
          fontFamily: 'var(--font-syne)',
          fontSize: '42px', lineHeight: 0.92,
          color: '#F0F0F0', letterSpacing: '0.04em',
          marginBottom: '8px',
        }}>
          {user.nombre.toUpperCase()} {user.apellido.toUpperCase()}
        </h1>
        <p style={{ fontSize: '12px', color: '#444444', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </p>
      </div>

      {/* Stats grid */}
      <div
        className="animate-fade-up delay-100"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1px',
          background: '#282828',
          border: '1px solid #282828',
          marginBottom: '40px',
        }}
      >
        {stats.map((stat, i) => {
          const cardStyle = {
            background: stat.highlight ? '#141210' : stat.danger ? '#130A0A' : '#111111',
            padding: '24px 22px',
            borderTop: stat.highlight ? '2px solid #FF4400' : stat.danger ? '2px solid #DC2626' : '2px solid transparent',
            position: 'relative' as const,
            transition: 'background 0.18s',
            display: 'block',
            textDecoration: 'none',
            cursor: stat.href ? 'pointer' : 'default',
          }
          const inner = (
            <>
              <div
                style={{
                  width: '34px', height: '34px', borderRadius: '2px',
                  background: stat.highlight ? 'rgba(255,68,0,0.12)' : stat.danger ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
                  border: stat.highlight ? '1px solid rgba(255,68,0,0.25)' : stat.danger ? '1px solid rgba(220,38,38,0.25)' : '1px solid #282828',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stat.highlight ? '#FF4400' : stat.danger ? '#DC2626' : '#888888',
                  marginBottom: '14px',
                }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-syne)',
                  fontSize: stat.highlight ? '20px' : '28px',
                  color: stat.highlight ? '#FF4400' : stat.danger ? '#DC2626' : '#F0F0F0',
                  lineHeight: 1, marginBottom: '6px',
                  letterSpacing: stat.highlight ? '0.02em' : '0',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {stat.label}
              </div>
            </>
          )
          return stat.href ? (
            <Link key={i} href={stat.href} className="stat-card" style={cardStyle}>{inner}</Link>
          ) : (
            <div key={i} className="stat-card" style={cardStyle}>{inner}</div>
          )
        })}
      </div>

      {/* Out-of-stock products */}
      <div className="animate-fade-up delay-200" style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '1px', background: '#DC2626' }} />
            <h2 style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '13px', color: '#F0F0F0', letterSpacing: '0.12em',
            }}>
              PRODUCTOS SIN STOCK
            </h2>
          </div>
          {countSinStock > 0 && (
            <span style={{ fontSize: '11px', color: '#DC2626', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              {countSinStock} producto{countSinStock !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ border: '1px solid #282828', borderRadius: '2px', overflow: 'hidden' }}>
          {productosSinStock.length === 0 ? (
            <div style={{
              padding: '48px', textAlign: 'center', color: '#444444',
              fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '2px',
                border: '1px solid #282828',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444444',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              Todo el inventario tiene stock
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #282828' }}>
                  {['Producto', 'N° Serie', 'Sin stock en'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#444444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: '#111111',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(productosSinStock as ProductoSinStock[]).map((p, i) => (
                  <tr
                    key={p.id}
                    className="table-row"
                    style={{ borderBottom: i < productosSinStock.length - 1 ? '1px solid #1E1E1E' : 'none' }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#F0F0F0' }}>
                      {p.nombre}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888888', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {p.numeroSerie}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {p.inventario.map((inv) => (
                          <span
                            key={inv.sucursal.nombre}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              fontSize: '10px', fontWeight: 700,
                              padding: '3px 8px', borderRadius: '2px',
                              background: 'rgba(220,38,38,0.08)',
                              border: '1px solid rgba(220,38,38,0.25)',
                              color: '#DC2626',
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}
                          >
                            <span style={{
                              width: '5px', height: '5px', borderRadius: '50%',
                              background: '#DC2626', flexShrink: 0,
                            }} />
                            {inv.sucursal.nombre}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent sales */}
      <div className="animate-fade-up delay-300">
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '20px', height: '1px', background: '#FF4400' }} />
            <h2 style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '13px', color: '#F0F0F0', letterSpacing: '0.12em',
            }}>
              VENTAS RECIENTES
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Últimas {recentVentas.length}
          </span>
        </div>

        <div style={{ border: '1px solid #282828', borderRadius: '2px', overflow: 'hidden' }}>
          {recentVentas.length === 0 ? (
            <div style={{
              padding: '60px', textAlign: 'center', color: '#444444',
              fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '2px',
                border: '1px solid #282828',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: '#444444',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
              </div>
              Sin ventas registradas
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #282828' }}>
                  {['# Venta', 'Fecha', 'Cajero', 'Sucursal', 'Método', 'Items', 'Total con IVA'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#444444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: '#111111',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentVentas as VentaRow[]).map((venta, i) => (
                  <tr
                    key={venta.id}
                    className="table-row"
                    style={{
                      borderBottom: i < recentVentas.length - 1 ? '1px solid #1E1E1E' : 'none',
                    }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#FF4400', fontWeight: 700, fontFamily: 'var(--font-syne)', letterSpacing: '0.06em' }}>
                      #{String(venta.id).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#888888', whiteSpace: 'nowrap' }}>
                      {formatDate(venta.fecha)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#F0F0F0' }}>
                      {venta.usuario.nombre} {venta.usuario.apellido}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#888888' }}>
                      {venta.sucursal.nombre}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className={`badge ${venta.metodoPago === 'efectivo' ? 'badge-success' : 'badge-muted'}`}>
                        {metodoPagoLabel[venta.metodoPago]}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#888888' }}>
                      {venta._count.detalles}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '14px', color: '#22C55E', fontWeight: 700, fontFamily: 'var(--font-syne)', letterSpacing: '0.02em' }}>
                      {formatCurrency(Number(venta.totalConIva))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
