'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthPayload } from '@/lib/auth'

interface Sucursal { id: number; nombre: string }

interface VentaDetalle { producto: string; cantidad: number; precioUnit: number; subtotal: number }

interface VentaPreview {
  id: number
  hora: string
  metodoPago: 'efectivo' | 'transferencia'
  subtotal: number
  totalIva: number
  totalConIva: number
  usuario: string
  detalles: VentaDetalle[]
}

interface Preview {
  sucursalNombre: string
  ventas: VentaPreview[]
  totals: {
    count: number
    efectivo: number
    transferencia: number
    subtotal: number
    totalIva: number
    totalConIva: number
  }
  hasSales: boolean
}

interface CorteRecord {
  id: number
  fecha: string
  cantidadVentas: number
  totalEfectivo: string
  totalTransferencia: string
  subtotal: string
  totalIva: string
  totalConIva: string
  sucursal: { nombre: string }
  usuario: { nombre: string; apellido: string }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const fmtDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

const METODO_LABEL: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia' }
const METODO_COLOR: Record<string, string> = { efectivo: '#22C55E', transferencia: '#A855F7' }

export default function CorteCajaPage() {
  const router = useRouter()
  const [user, setUser]                     = useState<AuthPayload | null>(null)
  const [sucursales, setSucursales]         = useState<Sucursal[]>([])
  const [selectedSucursal, setSelectedSucursal] = useState<number | null>(null)

  const [preview, setPreview]               = useState<Preview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [expandedVenta, setExpandedVenta]   = useState<number | null>(null)

  const [cortes, setCortes]                 = useState<CorteRecord[]>([])
  const [loadingCortes, setLoadingCortes]   = useState(false)

  const [confirming, setConfirming]         = useState(false)
  const [processing, setProcessing]         = useState(false)
  const [successId, setSuccessId]           = useState<number | null>(null)
  const [error, setError]                   = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d) router.push('/login')
        else { setUser(d); if (d.sucursalId) setSelectedSucursal(d.sucursalId) }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!user || user.rol === 'cajero') return
    fetch('/api/admin/sucursales')
      .then(r => r.json())
      .then(d => setSucursales(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
  }, [user])

  const loadPreview = useCallback(async (sid: number) => {
    setLoadingPreview(true)
    setPreview(null)
    setError('')
    try {
      const res  = await fetch(`/api/corte/preview?sucursalId=${sid}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) { setError(data?.error ?? 'Error al cargar preview'); return }
      setPreview(data)
    } catch {
      setError('Error al cargar preview')
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  const loadCortes = useCallback(async (sid: number) => {
    setLoadingCortes(true)
    try {
      const res  = await fetch(`/api/corte?sucursalId=${sid}`)
      const data = await res.json().catch(() => null)
      if (res.ok && data) setCortes(Array.isArray(data) ? data : [])
    } catch {
      // ignore
    } finally {
      setLoadingCortes(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedSucursal) return
    loadPreview(selectedSucursal)
    loadCortes(selectedSucursal)
  }, [selectedSucursal, loadPreview, loadCortes])

  async function handleCorte() {
    if (!selectedSucursal) return
    setProcessing(true)
    setError('')
    try {
      const res  = await fetch('/api/corte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sucursalId: selectedSucursal }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al procesar corte'); return }
      setSuccessId(data.id)
      setConfirming(false)
      loadPreview(selectedSucursal)
      loadCortes(selectedSucursal)
    } finally {
      setProcessing(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const isAdmin = user?.rol === 'administrador' || user?.rol === 'manager'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#060A12' }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', background: '#0B1121', borderBottom: '1px solid #1C2B3F',
        flexShrink: 0, gap: '16px',
      }}>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '16px', letterSpacing: '0.1em', color: '#F59E0B', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          Autopartes Guerrero
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {user && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF' }}>{user.nombre} {user.apellido}</div>
              <span className="badge badge-success" style={{ fontSize: '10px' }}>{user.rol}</span>
            </div>
          )}
          <a href="/caja" className="btn-ghost" style={{ fontSize: '12px', padding: '7px 12px' }}>← Volver a Caja</a>
          {isAdmin && <a href="/admin" className="btn-ghost" style={{ fontSize: '12px', padding: '7px 12px' }}>Admin</a>}
          <button onClick={handleLogout} className="btn-ghost" style={{ fontSize: '12px', padding: '7px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '960px', width: '100%', margin: '0 auto' }}>

        {/* Title + branch selector */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
              Corte de Caja
            </h1>
            <p style={{ color: '#8896B3', fontSize: '14px', margin: '4px 0 0', textTransform: 'capitalize' }}>{today}</p>
          </div>
          {isAdmin && sucursales.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sucursal</label>
              <select
                className="input-base"
                value={selectedSucursal ?? ''}
                onChange={e => { setSelectedSucursal(Number(e.target.value)); setSuccessId(null); setError('') }}
                style={{ minWidth: '200px' }}
              >
                <option value="">Seleccionar sucursal…</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          )}
        </div>

        {!selectedSucursal ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#8896B3' }}>
            Selecciona una sucursal para ver el resumen de ventas del día.
          </div>
        ) : (
          <>
            {successId && (
              <div style={{ padding: '14px 18px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#22C55E' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Corte de caja #{successId} registrado correctamente.
              </div>
            )}
            {error && (
              <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            {/* ── Preview card ── */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '16px', color: '#E8EDFF', margin: 0 }}>
                  Ventas del día
                  {preview && <span style={{ color: '#8896B3', fontWeight: 400 }}> — {preview.sucursalNombre}</span>}
                </h2>
                {preview?.hasSales && (
                  <span style={{ fontSize: '12px', color: '#8896B3' }}>
                    {preview.totals.count} venta{preview.totals.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loadingPreview ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8896B3' }}>Cargando…</div>
              ) : preview && !preview.hasSales ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#8896B3' }}>
                  No hay ventas registradas hoy para esta sucursal.
                </div>
              ) : preview ? (
                <>
                  {/* ── Individual sales table ── */}
                  <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1C2B3F' }}>
                          {['#', 'Hora', 'Vendedor', 'Método', 'Subtotal', 'IVA', 'Total', ''].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Subtotal' || h === 'IVA' || h === 'Total' ? 'right' : 'left', fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.ventas.map((v, idx) => (
                          <React.Fragment key={v.id}>
                            <tr
                              style={{ borderBottom: expandedVenta === v.id ? 'none' : '1px solid #1C2B3F', cursor: 'pointer' }}
                              onClick={() => setExpandedVenta(expandedVenta === v.id ? null : v.id)}
                            >
                              <td style={{ padding: '12px 14px', fontSize: '12px', color: '#374151' }}>{idx + 1}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#E8EDFF', whiteSpace: 'nowrap' }}>{v.hora}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8896B3', whiteSpace: 'nowrap' }}>{v.usuario}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: `${METODO_COLOR[v.metodoPago]}18`, color: METODO_COLOR[v.metodoPago], border: `1px solid ${METODO_COLOR[v.metodoPago]}40` }}>
                                  {METODO_LABEL[v.metodoPago]}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8896B3', textAlign: 'right' }}>{fmt(v.subtotal)}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', color: '#8896B3', textAlign: 'right' }}>{fmt(v.totalIva)}</td>
                              <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#E8EDFF', textAlign: 'right' }}>{fmt(v.totalConIva)}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8896B3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedVenta === v.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                                  <polyline points="6 9 12 15 18 9"/>
                                </svg>
                              </td>
                            </tr>
                            {expandedVenta === v.id && (
                              <tr key={`${v.id}-detail`} style={{ borderBottom: '1px solid #1C2B3F' }}>
                                <td colSpan={8} style={{ padding: '0 14px 12px 42px' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr>
                                        {['Producto', 'Cant.', 'Precio unit.', 'Subtotal'].map(h => (
                                          <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Cant.' || h === 'Precio unit.' || h === 'Subtotal' ? 'right' : 'left', fontSize: '11px', color: '#374151', fontWeight: 600 }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {v.detalles.map((d, i) => (
                                        <tr key={i}>
                                          <td style={{ padding: '5px 10px', fontSize: '12px', color: '#8896B3' }}>{d.producto}</td>
                                          <td style={{ padding: '5px 10px', fontSize: '12px', color: '#8896B3', textAlign: 'right' }}>{d.cantidad}</td>
                                          <td style={{ padding: '5px 10px', fontSize: '12px', color: '#8896B3', textAlign: 'right' }}>{fmt(d.precioUnit)}</td>
                                          <td style={{ padding: '5px 10px', fontSize: '12px', color: '#8896B3', textAlign: 'right' }}>{fmt(d.subtotal)}</td>
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
                  </div>

                  {/* ── Summary ── */}
                  <div style={{ borderTop: '1px solid #1C2B3F', paddingTop: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                      Resumen del día
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', padding: '16px' }}>
                      {[
                        { label: 'Total ventas',    value: String(preview.totals.count),             plain: true },
                        { label: 'Efectivo',         value: fmt(preview.totals.efectivo),             color: '#22C55E' },
                        { label: 'Transferencia',    value: fmt(preview.totals.transferencia),        color: '#A855F7' },
                        { label: 'Subtotal (s/IVA)', value: fmt(preview.totals.subtotal) },
                        { label: 'IVA (16%)',        value: fmt(preview.totals.totalIva) },
                        { label: 'Total del día',    value: fmt(preview.totals.totalConIva),          highlight: true },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
                          <span style={{ fontSize: item.highlight ? '20px' : '15px', fontWeight: item.highlight ? 700 : 600, color: item.highlight ? '#F59E0B' : item.color ?? '#E8EDFF', fontFamily: item.highlight ? 'var(--font-syne)' : undefined }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Confirm ── */}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                    {!confirming ? (
                      <button className="btn-accent" onClick={() => setConfirming(true)}>
                        Realizar corte de caja
                      </button>
                    ) : (
                      <>
                        <div style={{ fontSize: '13px', color: '#E8EDFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          ¿Confirmar corte de {preview.totals.count} venta{preview.totals.count !== 1 ? 's' : ''} por {fmt(preview.totals.totalConIva)}?
                        </div>
                        <button className="btn-ghost" onClick={() => setConfirming(false)} disabled={processing}>Cancelar</button>
                        <button className="btn-accent" onClick={handleCorte} disabled={processing}>
                          {processing ? 'Procesando…' : 'Confirmar'}
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* ── Corte history ── */}
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '16px', color: '#E8EDFF', margin: '0 0 16px' }}>
                Cortes anteriores
              </h2>
              {loadingCortes ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#8896B3' }}>Cargando…</div>
              ) : cortes.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#8896B3' }}>Sin cortes registrados.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1C2B3F' }}>
                      {['Fecha', 'Ventas', 'Efectivo', 'Transferencia', 'IVA', 'Total', 'Realizado por'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cortes.map(c => (
                      <tr key={c.id} className="table-row" style={{ borderBottom: '1px solid #1C2B3F' }}>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#E8EDFF', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{fmtDate(c.fecha.slice(0, 10))}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#8896B3' }}>{c.cantidadVentas}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#22C55E' }}>{fmt(Number(c.totalEfectivo))}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#A855F7' }}>{fmt(Number(c.totalTransferencia))}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#8896B3' }}>{fmt(Number(c.totalIva))}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 600, color: '#F59E0B', fontFamily: 'var(--font-syne)' }}>{fmt(Number(c.totalConIva))}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#8896B3' }}>{c.usuario.nombre} {c.usuario.apellido}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
