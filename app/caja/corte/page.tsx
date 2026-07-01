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

interface GastoItem { descripcion: string; monto: string }

interface GastoRecord { id: number; descripcion: string; monto: string }

interface CorteRecord {
  id: number
  fecha: string
  cantidadVentas: number
  totalEfectivo: string
  totalTransferencia: string
  subtotal: string
  totalIva: string
  totalConIva: string
  totalGastos: string
  sucursal: { nombre: string }
  usuario: { nombre: string; apellido: string }
  gastos: GastoRecord[]
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

  const [gastos, setGastos]                 = useState<GastoItem[]>([])

  const [confirming, setConfirming]         = useState(false)
  const [processing, setProcessing]         = useState(false)
  const [successId, setSuccessId]           = useState<number | null>(null)
  const [lastCorteData, setLastCorteData]   = useState<{ preview: Preview; gastos: GastoItem[] } | null>(null)
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

  const totalGastos = gastos.reduce((s, g) => s + (Number(g.monto) || 0), 0)

  function addGasto() { setGastos(prev => [...prev, { descripcion: '', monto: '' }]) }

  function removeGasto(idx: number) { setGastos(prev => prev.filter((_, i) => i !== idx)) }

  function updateGasto(idx: number, field: keyof GastoItem, value: string) {
    setGastos(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g))
  }

  async function handleCorte() {
    if (!selectedSucursal || !preview) return
    setProcessing(true)
    setError('')
    try {
      const validGastos = gastos
        .filter(g => g.descripcion.trim() && Number(g.monto) > 0)
        .map(g => ({ descripcion: g.descripcion.trim(), monto: Number(g.monto) }))

      const res = await fetch('/api/corte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sucursalId: selectedSucursal, gastos: validGastos }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al procesar corte'); return }
      setLastCorteData({ preview, gastos: gastos.filter(g => g.descripcion.trim() && Number(g.monto) > 0) })
      setSuccessId(data.id)
      setConfirming(false)
      setGastos([])
      generatePDF(data.id, preview, validGastos)
      loadPreview(selectedSucursal)
      loadCortes(selectedSucursal)
    } finally {
      setProcessing(false)
    }
  }

  async function generatePDF(corteId: number, previewData: Preview, corteGastos: { descripcion: string; monto: number }[]) {
    if (!user) return
    const now = new Date()
    const fechaHora = now.toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })
    const gastosTotal = corteGastos.reduce((s, g) => s + g.monto, 0)
    const neto = previewData.totals.totalConIva - gastosTotal

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.1em;">AUTOPARTES GUERRERO</h1>
          <p style="margin: 6px 0 0; font-size: 14px; color: #666;">Corte de Caja #${corteId}</p>
        </div>
        <table style="width: 100%; margin-bottom: 20px; font-size: 13px;">
          <tr><td style="padding: 4px 0; color: #666; width: 140px;">Fecha y hora:</td><td style="padding: 4px 0; text-transform: capitalize;">${fechaHora}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Sucursal:</td><td style="padding: 4px 0;">${previewData.sucursalNombre}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Realizado por:</td><td style="padding: 4px 0;">${user.nombre} ${user.apellido} (${user.rol})</td></tr>
        </table>
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px;">Resumen de Ventas</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Total de ventas</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${previewData.totals.count}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Efectivo</td><td style="padding: 8px 0; text-align: right; color: #16a34a;">${fmt(previewData.totals.efectivo)}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Transferencia</td><td style="padding: 8px 0; text-align: right; color: #9333ea;">${fmt(previewData.totals.transferencia)}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">Subtotal (sin IVA)</td><td style="padding: 8px 0; text-align: right;">${fmt(previewData.totals.subtotal)}</td></tr>
          <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #666;">IVA (16%)</td><td style="padding: 8px 0; text-align: right;">${fmt(previewData.totals.totalIva)}</td></tr>
          <tr><td style="padding: 10px 0; font-weight: 700; font-size: 15px;">Total del día</td><td style="padding: 10px 0; text-align: right; font-weight: 700; font-size: 15px;">${fmt(previewData.totals.totalConIva)}</td></tr>
        </table>
        ${corteGastos.length > 0 ? `
          <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px;">Gastos</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 1px solid #ddd;">
                <th style="padding: 8px 0; text-align: left; color: #666; font-weight: 600;">Descripción</th>
                <th style="padding: 8px 0; text-align: right; color: #666; font-weight: 600;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${corteGastos.map(g => `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0;">${g.descripcion}</td><td style="padding: 8px 0; text-align: right; color: #dc2626;">${fmt(g.monto)}</td></tr>`).join('')}
              <tr><td style="padding: 10px 0; font-weight: 700;">Total gastos</td><td style="padding: 10px 0; text-align: right; font-weight: 700; color: #dc2626;">${fmt(gastosTotal)}</td></tr>
            </tbody>
          </table>
        ` : ''}
        <div style="border-top: 2px solid #333; padding-top: 12px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700;">
          <span>Neto del día</span>
          <span>${fmt(neto)}</span>
        </div>
        <p style="text-align: center; color: #999; font-size: 11px; margin-top: 32px;">Documento generado el ${fechaHora}</p>
      </div>
    `

    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.width = '700px'
    container.style.background = '#fff'
    container.innerHTML = html
    document.body.appendChild(container)

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    const html2pdf = (await import('html2pdf.js')).default
    const dateStr = now.toISOString().slice(0, 10)
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `CorteCaja_${corteId}_${dateStr}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, width: 700 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(container).save()

    document.body.removeChild(container)
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
                        { label: 'Total ventas',     value: fmt(preview.totals.totalConIva),          highlight: true },
                        ...(totalGastos > 0 ? [
                          { label: 'Total gastos',   value: fmt(totalGastos),                         color: '#EF4444' },
                          { label: 'Neto del día',   value: fmt(preview.totals.totalConIva - totalGastos), highlight: true },
                        ] : []),
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

                  {/* ── Gastos ── */}
                  <div style={{ borderTop: '1px solid #1C2B3F', paddingTop: '20px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                        Gastos del día
                      </h3>
                      <button type="button" className="btn-ghost" onClick={addGasto} style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Agregar gasto
                      </button>
                    </div>
                    {gastos.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#8896B3', margin: 0 }}>No se han registrado gastos. Puedes agregar gastos antes de realizar el corte.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {gastos.map((g, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              className="input-base"
                              placeholder="Descripción del gasto"
                              value={g.descripcion}
                              onChange={e => updateGasto(idx, 'descripcion', e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <input
                              className="input-base"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Monto"
                              value={g.monto}
                              onChange={e => updateGasto(idx, 'monto', e.target.value)}
                              style={{ width: '140px', textAlign: 'right' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeGasto(idx)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px', display: 'flex', flexShrink: 0 }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                        {totalGastos > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #1C2B3F' }}>
                            <span style={{ fontSize: '12px', color: '#8896B3', textTransform: 'uppercase' }}>Total gastos:</span>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>{fmt(totalGastos)}</span>
                          </div>
                        )}
                      </div>
                    )}
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
                      {['Fecha', 'Ventas', 'Efectivo', 'Transferencia', 'IVA', 'Total', 'Gastos', 'Realizado por'].map(h => (
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
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: Number(c.totalGastos) > 0 ? '#EF4444' : '#8896B3' }}>{Number(c.totalGastos) > 0 ? fmt(Number(c.totalGastos)) : '—'}</td>
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
