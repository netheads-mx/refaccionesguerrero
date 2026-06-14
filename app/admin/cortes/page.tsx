'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface CorteCaja {
  id: number
  fecha: string
  cantidadVentas: number
  totalEfectivo: string
  totalTransferencia: string
  subtotal: string
  totalIva: string
  totalConIva: string
  creadoEn: string
  sucursal: { id: number; nombre: string }
  usuario: { id: number; nombre: string; apellido: string }
}

interface Sucursal { id: number; nombre: string }

const LIMITS = [10, 20, 50]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function CortesPage() {
  const [cortes, setCortes]         = useState<CorteCaja[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  const [sucursalFilter, setSucursalFilter] = useState('')
  const [desde, setDesde]                   = useState('')
  const [hasta, setHasta]                   = useState('')

  const fetchRef = useRef(0)

  const load = useCallback(async (p = page) => {
    const id = ++fetchRef.current
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (sucursalFilter) params.set('sucursalId', sucursalFilter)
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const res = await fetch(`/api/admin/cortes?${params}`)
      if (fetchRef.current !== id) return
      const json = await res.json()
      if (!res.ok) return
      setCortes(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
      setPage(p)
    } catch {
      // network error — leave current data in place
    } finally {
      if (fetchRef.current === id) setLoading(false)
    }
  }, [page, limit, sucursalFilter, desde, hasta])

  useEffect(() => { load(1) }, [limit, sucursalFilter, desde, hasta]) // eslint-disable-line
  useEffect(() => { load(page) }, [page]) // eslint-disable-line

  useEffect(() => {
    fetch('/api/admin/sucursales').then(r => r.json()).then(d => setSucursales(Array.isArray(d) ? d : d.data ?? [])).catch(() => {})
  }, [])

  // Totals of visible page
  const pageTotals = cortes.reduce(
    (acc, c) => ({
      ventas:          acc.ventas + c.cantidadVentas,
      efectivo:        acc.efectivo + Number(c.totalEfectivo),
      transferencia:   acc.transferencia + Number(c.totalTransferencia),
      iva:             acc.iva + Number(c.totalIva),
      total:           acc.total + Number(c.totalConIva),
    }),
    { ventas: 0, efectivo: 0, transferencia: 0, iva: 0, total: 0 }
  )

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
    <div style={{ padding: '32px', maxWidth: '1300px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
            Cortes de Caja
          </h1>
          <p style={{ color: '#8896B3', fontSize: '14px', margin: '4px 0 0' }}>
            {total.toLocaleString()} corte{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/caja/corte" className="btn-accent" style={{ textDecoration: 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Realizar corte
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sucursal</label>
          <select className="input-base" style={{ width: '180px' }} value={sucursalFilter} onChange={e => { setSucursalFilter(e.target.value); setPage(1) }}>
            <option value="">Todas</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desde</label>
          <input type="date" className="input-base" value={desde} onChange={e => { setDesde(e.target.value); setPage(1) }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hasta</label>
          <input type="date" className="input-base" value={hasta} onChange={e => { setHasta(e.target.value); setPage(1) }} />
        </div>
        {(sucursalFilter || desde || hasta) && (
          <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => { setSucursalFilter(''); setDesde(''); setHasta(''); setPage(1) }}>
            Limpiar filtros
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {LIMITS.map(l => (
            <button key={l} onClick={() => { setLimit(l); setPage(1) }} style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid', fontSize: '13px', cursor: 'pointer',
              background: limit === l ? 'rgba(245,158,11,0.15)' : 'transparent',
              borderColor: limit === l ? '#F59E0B' : '#1C2B3F',
              color: limit === l ? '#F59E0B' : '#8896B3',
              fontWeight: limit === l ? 600 : 400, transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Summary totals for current page */}
      {!loading && cortes.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px', marginBottom: '16px',
          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
          borderRadius: '10px', padding: '16px',
        }}>
          {[
            { label: 'Cortes', value: String(cortes.length), plain: true },
            { label: 'Ventas', value: String(pageTotals.ventas), plain: true },
            { label: 'Efectivo', value: fmt(pageTotals.efectivo), color: '#22C55E' },
            { label: 'Transferencia', value: fmt(pageTotals.transferencia), color: '#A855F7' },
            { label: 'IVA', value: fmt(pageTotals.iva) },
            { label: 'Total', value: fmt(pageTotals.total), highlight: true },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
              <span style={{
                fontSize: item.highlight ? '16px' : '14px', fontWeight: item.highlight ? 700 : 600,
                color: item.highlight ? '#F59E0B' : item.color ?? '#E8EDFF',
                fontFamily: item.highlight ? 'var(--font-syne)' : undefined,
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>Cargando…</div>
        ) : cortes.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>No se encontraron cortes.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2B3F' }}>
                {['#', 'Fecha', 'Sucursal', 'Ventas', 'Efectivo', 'Transferencia', 'IVA', 'Total', 'Realizado por'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cortes.map(c => (
                <tr key={c.id} className="table-row" style={{ borderBottom: '1px solid #1C2B3F' }}>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: '#374151' }}>#{c.id}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#E8EDFF', whiteSpace: 'nowrap' }}>{fmtDate(c.fecha.slice(0, 10))}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{c.sucursal.nombre}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3', textAlign: 'center' }}>{c.cantidadVentas}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#22C55E' }}>{fmt(Number(c.totalEfectivo))}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#A855F7' }}>{fmt(Number(c.totalTransferencia))}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{fmt(Number(c.totalIva))}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 700, color: '#F59E0B', fontFamily: 'var(--font-syne)' }}>{fmt(Number(c.totalConIva))}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{c.usuario.nombre} {c.usuario.apellido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <span style={{ fontSize: '13px', color: '#8896B3' }}>{total.toLocaleString()} corte{total !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #1C2B3F', background: 'transparent', color: page === 1 ? '#2A3A54' : '#8896B3', cursor: page === 1 ? 'default' : 'pointer', fontSize: '13px' }}>‹</button>
            {pages().map((p, i) => (
              <button key={i} onClick={() => typeof p === 'number' && setPage(p)} disabled={p === '…'}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid', background: p === page ? 'rgba(245,158,11,0.15)' : 'transparent', borderColor: p === page ? '#F59E0B' : '#1C2B3F', color: p === page ? '#F59E0B' : p === '…' ? '#2A3A54' : '#8896B3', cursor: p === '…' || p === page ? 'default' : 'pointer', fontSize: '13px', fontWeight: p === page ? 700 : 400, minWidth: '34px' }}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #1C2B3F', background: 'transparent', color: page === totalPages ? '#2A3A54' : '#8896B3', cursor: page === totalPages ? 'default' : 'pointer', fontSize: '13px' }}>›</button>
          </div>
        </div>
      )}
    </div>
  )
}
