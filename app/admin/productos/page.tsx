'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ImportarModal } from './ImportarModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventarioItem {
  sucursalId: number
  stock: number
  sucursal: { id: number; nombre: string }
}

interface Producto {
  id: number
  numeroSerie: string
  nombre: string
  descripcion: string | null
  marca: string | null
  modelo: string | null
  color: string | null
  anioInicio: number | null
  anioFin: number | null
  precioUnitario: number
  activo: boolean
  inventario: InventarioItem[]
}

interface PageResult {
  data: Producto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const LIMIT_OPTIONS = [10, 20, 50, 100]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductosPage() {
  const [result, setResult]     = useState<PageResult | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Filters
  const [query, setQuery]           = useState('')
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(20)

  // Delete confirm
  const [confirmId, setConfirmId]         = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Import modal
  const [importOpen, setImportOpen] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch ──

  const fetchProductos = useCallback(async (p = page, q = query, l = limit) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(l), q })
      const res  = await fetch(`/api/admin/productos?${params}`)
      const text = await res.text()
      if (!text) throw new Error('Respuesta vacía del servidor')
      const json = JSON.parse(text)
      if (!res.ok) throw new Error(json.error ?? 'Error del servidor')
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [page, query, limit])

  useEffect(() => { fetchProductos() }, [page, limit])

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchProductos(1, query, limit)
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query])

  // ── Delete ──

  async function handleDelete() {
    if (!confirmId) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/admin/productos/${confirmId}`, { method: 'DELETE' })
      setConfirmId(null)
      fetchProductos(page, query, limit)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Pagination ──

  function pageNumbers(): (number | '…')[] {
    const total = result?.totalPages ?? 1
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (page <= 4)  return [1, 2, 3, 4, 5, '…', total]
    if (page >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '…', page - 1, page, page + 1, '…', total]
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const { data = [], total = 0, totalPages = 1 } = result ?? {}
  const confirmName = data.find((p) => p.id === confirmId)?.nombre ?? ''
  const start = result ? (result.page - 1) * result.limit + 1 : 0
  const end   = result ? Math.min(result.page * result.limit, total) : 0

  return (
    <div className="admin-page-content" style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF' }}>
            Productos
          </h1>
          <p style={{ fontSize: '13px', color: '#8896B3', marginTop: '3px' }}>
            {total > 0 ? `${total} producto${total !== 1 ? 's' : ''} en total` : 'Gestiona el catálogo de productos'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setImportOpen(true)}
            className="btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '13px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar
          </button>
          <Link href="/admin/productos/nuevo" className="btn-accent" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PlusIcon /> Nuevo producto
          </Link>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="animate-fade-up delay-100" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8896B3', pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            type="search"
            className="input-base"
            placeholder="Buscar por nombre, serie, marca, modelo, color…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>


<div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: '#8896B3', whiteSpace: 'nowrap' }}>Por página:</span>
          <div style={{ display: 'flex', border: '1px solid #1C2B3F', borderRadius: '8px', overflow: 'hidden' }}>
            {LIMIT_OPTIONS.map((l) => (
              <button
                key={l}
                onClick={() => { setLimit(l); setPage(1) }}
                style={{
                  padding: '7px 12px', fontSize: '12px', fontFamily: 'inherit',
                  border: 'none', borderRight: l !== 100 ? '1px solid #1C2B3F' : 'none',
                  cursor: 'pointer',
                  background: limit === l ? '#F59E0B' : '#0B1121',
                  color:      limit === l ? '#060A12'  : '#8896B3',
                  fontWeight: limit === l ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', display: 'flex', gap: '10px', alignItems: 'center' }}>
          {error}
          <button onClick={() => fetchProductos()} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px', textDecoration: 'underline' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="card animate-fade-up delay-200" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2B3F', background: '#0B1121' }}>
                {['N° Serie', 'Nombre', 'Marca / Modelo', 'Color', 'Año', 'Precio', 'Stock por sucursal', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#374151' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <Spinner /> Cargando productos…
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px', textAlign: 'center', color: '#374151', fontSize: '14px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                    {query ? 'Sin resultados para esa búsqueda' : 'No hay productos registrados'}
                  </td>
                </tr>
              ) : (
                data.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className="table-row" style={{ borderBottom: '1px solid #1C2B3F' }}>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: '#8896B3', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {p.numeroSerie}
                      </td>
                      <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nombre}
                        </div>
                        {p.descripcion && (
                          <div style={{ fontSize: '11px', color: '#374151', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.descripcion}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8896B3', whiteSpace: 'nowrap' }}>
                        {[p.marca, p.modelo].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8896B3' }}>
                        {p.color ?? '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8896B3', whiteSpace: 'nowrap' }}>
                        {p.anioInicio
                          ? p.anioFin && p.anioFin !== p.anioInicio
                            ? `${p.anioInicio}–${p.anioFin}`
                            : String(p.anioInicio)
                          : '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#F59E0B', whiteSpace: 'nowrap' }}>
                        {fmt(p.precioUnitario)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {p.inventario.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#374151' }}>Sin stock</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {p.inventario.map(inv => {
                              const color = inv.stock <= 0 ? '#EF4444' : inv.stock <= 3 ? '#F59E0B' : '#22C55E'
                              return (
                                <div key={inv.sucursalId} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color, minWidth: '24px', textAlign: 'right' }}>
                                    {inv.stock}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#8896B3' }}>{inv.sucursal.nombre}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${p.activo ? 'badge-success' : 'badge-muted'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link
                            href={`/admin/productos/${p.id}/editar`}
                            title="Editar"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '5px', borderRadius: '4px', display: 'flex', textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                          >
                            <EditIcon />
                          </Link>
                          <button
                            onClick={() => setConfirmId(p.id)}
                            title="Desactivar"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '5px', borderRadius: '4px', display: 'flex' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {confirmId === p.id && (
                      <tr style={{ background: 'rgba(239,68,68,0.04)' }}>
                        <td colSpan={9} style={{ padding: '12px 16px', borderBottom: '1px solid #1C2B3F' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', color: '#EF4444' }}>
                              ¿Desactivar <strong>"{confirmName}"</strong>? Ya no aparecerá en el punto de venta.
                            </span>
                            <button onClick={handleDelete} disabled={deleteLoading} className="btn-danger" style={{ fontSize: '12px' }}>
                              {deleteLoading ? <Spinner /> : <TrashIcon />} Desactivar
                            </button>
                            <button onClick={() => setConfirmId(null)} className="btn-ghost" style={{ fontSize: '12px', padding: '5px 10px' }}>
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #1C2B3F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#374151' }}>
              Mostrando {start}–{end} de {total} productos
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '6px 10px', background: '#0B1121', border: '1px solid #1C2B3F', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#374151' : '#8896B3', display: 'flex', alignItems: 'center' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>

              {pageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`e-${i}`} style={{ padding: '6px 4px', color: '#374151', fontSize: '13px' }}>…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    style={{
                      minWidth: '34px', padding: '6px 8px',
                      background: page === n ? '#F59E0B' : '#0B1121',
                      border: '1px solid', borderColor: page === n ? '#F59E0B' : '#1C2B3F',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
                      fontWeight: page === n ? 700 : 400,
                      color: page === n ? '#060A12' : '#8896B3',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '6px 10px', background: '#0B1121', border: '1px solid #1C2B3F', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#374151' : '#8896B3', display: 'flex', alignItems: 'center' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <ImportarModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={() => fetchProductos(page, query, limit)}
      />
    </div>
  )
}
