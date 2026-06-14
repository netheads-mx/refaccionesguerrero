'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

interface VentaDetalle {
  id: number
  cantidad: number
  precioUnit: number
  subtotal: number
  producto: { id: number; nombre: string; numeroSerie: string }
}

interface Venta {
  id: number
  fecha: string
  metodoPago: string
  subtotal: number
  ivaPorcentaje: number
  totalConIva: number
  usuario: { id: number; nombre: string; apellido: string }
  sucursal: { id: number; nombre: string }
  detalles: VentaDetalle[]
}

interface Sucursal { id: number; nombre: string }

const LIMITS = [10, 20, 50, 100]
const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
}
const METODO_COLORS: Record<string, string> = {
  efectivo: '#22C55E',
  transferencia: '#A855F7',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function VentasPage() {
  const [ventas, setVentas]         = useState<Venta[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Filters
  const [metodoPago, setMetodoPago]   = useState('')
  const [sucursalId, setSucursalId]   = useState('')
  const [fechaDesde, setFechaDesde]   = useState('')
  const [fechaHasta, setFechaHasta]   = useState('')
  const [sucursales, setSucursales]   = useState<Sucursal[]>([])

  // Summary
  const [summary, setSummary] = useState({ count: 0, total: 0 })

  const fetchRef = useRef(0)

  const load = useCallback(async (p = page) => {
    const id = ++fetchRef.current
    setLoading(true)
    const params = new URLSearchParams({
      page: String(p),
      limit: String(limit),
      ...(metodoPago ? { metodoPago } : {}),
      ...(sucursalId ? { sucursalId } : {}),
      ...(fechaDesde ? { fechaDesde } : {}),
      ...(fechaHasta ? { fechaHasta } : {}),
    })
    const res = await fetch(`/api/admin/ventas?${params}`)
    if (!res.ok || fetchRef.current !== id) return
    const json = await res.json()
    setVentas(json.data)
    setTotal(json.total)
    setTotalPages(json.totalPages)
    setPage(p)

    // compute summary from returned page
    const t = json.data.reduce((s: number, v: Venta) => s + Number(v.totalConIva), 0)
    setSummary({ count: json.total, total: t })
    setLoading(false)
  }, [page, limit, metodoPago, sucursalId, fechaDesde, fechaHasta])

  useEffect(() => { load(1) }, [limit, metodoPago, sucursalId, fechaDesde, fechaHasta]) // eslint-disable-line
  useEffect(() => { load(page) }, [page]) // eslint-disable-line

  useEffect(() => {
    fetch('/api/admin/sucursales').then(r => r.json()).then(setSucursales).catch(() => {})
  }, [])

  function clearFilters() {
    setMetodoPago('')
    setSucursalId('')
    setFechaDesde('')
    setFechaHasta('')
    setPage(1)
  }

  const hasFilters = metodoPago || sucursalId || fechaDesde || fechaHasta

  // Pagination pages
  function pages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | '…')[] = [1]
    if (page > 3) arr.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i)
    if (page < totalPages - 2) arr.push('…')
    arr.push(totalPages)
    return arr
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
            Ventas
          </h1>
          <p style={{ color: '#8896B3', fontSize: '14px', margin: '4px 0 0' }}>
            Historial completo de transacciones
          </p>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {hasFilters ? 'Filtradas' : 'Total ventas'}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#E8EDFF', fontFamily: 'var(--font-syne)' }}>
              {summary.count.toLocaleString()}
            </div>
          </div>
          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {hasFilters ? 'Monto pág.' : 'Monto pág.'}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#F59E0B', fontFamily: 'var(--font-syne)' }}>
              {fmt(summary.total)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Método de pago</label>
          <select
            className="input-base"
            style={{ width: '160px' }}
            value={metodoPago}
            onChange={e => { setMetodoPago(e.target.value); setPage(1) }}
          >
            <option value="">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sucursal</label>
          <select
            className="input-base"
            style={{ width: '180px' }}
            value={sucursalId}
            onChange={e => { setSucursalId(e.target.value); setPage(1) }}
          >
            <option value="">Todas</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desde</label>
          <input
            type="date"
            className="input-base"
            value={fechaDesde}
            onChange={e => { setFechaDesde(e.target.value); setPage(1) }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hasta</label>
          <input
            type="date"
            className="input-base"
            value={fechaHasta}
            onChange={e => { setFechaHasta(e.target.value); setPage(1) }}
          />
        </div>

        {hasFilters && (
          <button className="btn-ghost" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
            Limpiar filtros
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
          {LIMITS.map(l => (
            <button
              key={l}
              onClick={() => { setLimit(l); setPage(1) }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid',
                fontSize: '13px',
                cursor: 'pointer',
                background: limit === l ? 'rgba(245,158,11,0.15)' : 'transparent',
                borderColor: limit === l ? '#F59E0B' : '#1C2B3F',
                color: limit === l ? '#F59E0B' : '#8896B3',
                fontWeight: limit === l ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>Cargando…</div>
        ) : ventas.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>
            No se encontraron ventas{hasFilters ? ' con esos filtros' : ''}.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2B3F' }}>
                {['#', 'Fecha', 'Vendedor', 'Sucursal', 'Método', 'Subtotal', 'IVA', 'Total', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <React.Fragment key={v.id}>
                  <tr
                    className="table-row"
                    style={{ borderBottom: expandedId === v.id ? 'none' : '1px solid #1C2B3F', cursor: 'pointer' }}
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  >
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>#{v.id}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#E8EDFF' }}>{fmtDate(v.fecha)}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#E8EDFF' }}>{v.usuario.nombre} {v.usuario.apellido}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{v.sucursal.nombre}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: `${METODO_COLORS[v.metodoPago]}18`,
                        color: METODO_COLORS[v.metodoPago],
                        border: `1px solid ${METODO_COLORS[v.metodoPago]}40`,
                      }}>
                        {METODO_LABELS[v.metodoPago] ?? v.metodoPago}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{fmt(Number(v.subtotal))}</td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{Number(v.ivaPorcentaje)}%</td>
                    <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700, color: '#F59E0B' }}>{fmt(Number(v.totalConIva))}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="#8896B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: expandedId === v.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </td>
                  </tr>

                  {expandedId === v.id && (
                    <tr style={{ borderBottom: '1px solid #1C2B3F' }}>
                      <td colSpan={9} style={{ padding: '0 16px 16px 40px', background: 'rgba(245,158,11,0.03)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                          <thead>
                            <tr>
                              {['N° Serie', 'Producto', 'Cantidad', 'Precio unit.', 'Subtotal'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, borderBottom: '1px solid #1C2B3F' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {v.detalles.map(d => (
                              <tr key={d.id}>
                                <td style={{ padding: '8px 12px', fontSize: '12px', color: '#8896B3', fontFamily: 'monospace' }}>{d.producto.numeroSerie}</td>
                                <td style={{ padding: '8px 12px', fontSize: '13px', color: '#E8EDFF' }}>{d.producto.nombre}</td>
                                <td style={{ padding: '8px 12px', fontSize: '13px', color: '#E8EDFF' }}>{d.cantidad}</td>
                                <td style={{ padding: '8px 12px', fontSize: '13px', color: '#8896B3' }}>{fmt(Number(d.precioUnit))}</td>
                                <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#F59E0B' }}>{fmt(Number(d.subtotal))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <span style={{ fontSize: '13px', color: '#8896B3' }}>
            {total.toLocaleString()} venta{total !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 10px', borderRadius: '6px', border: '1px solid #1C2B3F',
                background: 'transparent', color: page === 1 ? '#2A3A54' : '#8896B3',
                cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px',
              }}
            >‹</button>
            {pages().map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === 'number' && setPage(p)}
                disabled={p === '…'}
                style={{
                  padding: '6px 10px', borderRadius: '6px', border: '1px solid',
                  background: p === page ? 'rgba(245,158,11,0.15)' : 'transparent',
                  borderColor: p === page ? '#F59E0B' : '#1C2B3F',
                  color: p === page ? '#F59E0B' : p === '…' ? '#2A3A54' : '#8896B3',
                  cursor: p === '…' || p === page ? 'default' : 'pointer',
                  fontSize: '13px', fontWeight: p === page ? 700 : 400, minWidth: '34px',
                }}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 10px', borderRadius: '6px', border: '1px solid #1C2B3F',
                background: 'transparent', color: page === totalPages ? '#2A3A54' : '#8896B3',
                cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px',
              }}
            >›</button>
          </div>
        </div>
      )}
    </div>
  )
}
