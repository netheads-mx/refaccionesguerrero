'use client'

import { useState, useEffect } from 'react'

interface CotizacionDetalle {
  id: number
  productoId: number
  cantidad: number
  precioUnit: string
  subtotal: string
  producto: { nombre: string; numeroSerie: string }
}

interface Cotizacion {
  id: number
  fecha: string
  nombreCliente: string | null
  total: string
  sucursalId: number
  usuario: { nombre: string; apellido: string }
  sucursal: { nombre: string }
  detalles: CotizacionDetalle[]
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [convertModal, setConvertModal] = useState<Cotizacion | null>(null)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [claveRastreo, setClaveRastreo] = useState('')
  const [converting, setConverting] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetchCotizaciones()
  }, [])

  function fetchCotizaciones() {
    setLoading(true)
    fetch('/api/cotizaciones')
      .then((r) => r.json())
      .then((data) => {
        setCotizaciones(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta cotización?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cotizaciones/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Error al eliminar')
        return
      }
      setCotizaciones((prev) => prev.filter((c) => c.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch {
      alert('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleConvert() {
    if (!convertModal) return
    setConverting(true)
    setActionError('')
    try {
      const res = await fetch(`/api/cotizaciones/${convertModal.id}/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metodoPago,
          claveRastreo: metodoPago === 'transferencia' ? claveRastreo : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActionError(data.error || 'Error al convertir')
        return
      }
      alert(`Venta #${data.id} creada exitosamente por ${fmtMXN(data.totalConIva)}`)
      setConvertModal(null)
      setMetodoPago('efectivo')
      setClaveRastreo('')
      setCotizaciones((prev) => prev.filter((c) => c.id !== convertModal.id))
    } catch {
      setActionError('Error de conexión')
    } finally {
      setConverting(false)
    }
  }

  const fmtMXN = (n: number | string) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n))

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '22px',
            fontWeight: 700,
            color: '#F0F0F0',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Cotizaciones
        </h1>
        <p style={{ fontSize: '13px', color: '#888888', marginTop: '4px' }}>
          Historial de cotizaciones generadas desde el punto de venta
        </p>
      </div>

      {loading ? (
        <div style={{ color: '#888888', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
          Cargando cotizaciones...
        </div>
      ) : cotizaciones.length === 0 ? (
        <div style={{ color: '#888888', fontSize: '13px', padding: '40px 0', textAlign: 'center' }}>
          No hay cotizaciones registradas.
        </div>
      ) : (
        <div
          style={{
            background: '#111111',
            border: '1px solid #282828',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #282828' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Vendedor</th>
                <th style={thStyle}>Sucursal</th>
                <th style={thStyle}>Productos</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '120px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c) => (
                <>
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #1a1a1a',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,68,0,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td
                      style={{ ...tdStyle, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {c.id}
                    </td>
                    <td
                      style={{ ...tdStyle, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {fmtDate(c.fecha)}
                    </td>
                    <td
                      style={{ ...tdStyle, cursor: 'pointer', color: c.nombreCliente ? '#ccc' : '#555' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {c.nombreCliente || '—'}
                    </td>
                    <td
                      style={{ ...tdStyle, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {c.usuario.nombre} {c.usuario.apellido}
                    </td>
                    <td
                      style={{ ...tdStyle, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {c.sucursal.nombre}
                    </td>
                    <td
                      style={{ ...tdStyle, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {c.detalles.length}
                    </td>
                    <td
                      style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    >
                      {fmtMXN(c.total)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        {/* Convert to sale */}
                        <button
                          title="Convertir a venta"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConvertModal(c)
                            setActionError('')
                          }}
                          style={{
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            borderRadius: '4px',
                            color: '#22C55E',
                            cursor: 'pointer',
                            padding: '5px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            transition: 'all 0.12s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(34,197,94,0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(34,197,94,0.1)'
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          Vender
                        </button>
                        {/* Delete */}
                        <button
                          title="Eliminar cotización"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(c.id)
                          }}
                          disabled={deletingId === c.id}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '4px',
                            color: '#EF4444',
                            cursor: deletingId === c.id ? 'wait' : 'pointer',
                            padding: '5px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '11px',
                            transition: 'all 0.12s',
                            opacity: deletingId === c.id ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr key={`${c.id}-details`}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <div
                          style={{
                            background: '#0d0d0d',
                            borderTop: '1px solid #282828',
                            borderBottom: '1px solid #282828',
                            padding: '12px 16px',
                          }}
                        >
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ ...thStyle, fontSize: '10px', padding: '4px 8px' }}>
                                  Producto
                                </th>
                                <th style={{ ...thStyle, fontSize: '10px', padding: '4px 8px' }}>
                                  No. Serie
                                </th>
                                <th
                                  style={{
                                    ...thStyle,
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    textAlign: 'center',
                                  }}
                                >
                                  Cant.
                                </th>
                                <th
                                  style={{
                                    ...thStyle,
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    textAlign: 'right',
                                  }}
                                >
                                  P. Unit.
                                </th>
                                <th
                                  style={{
                                    ...thStyle,
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    textAlign: 'right',
                                  }}
                                >
                                  Subtotal
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.detalles.map((d) => (
                                <tr key={d.id}>
                                  <td style={{ ...tdStyle, fontSize: '12px', padding: '6px 8px' }}>
                                    {d.producto.nombre}
                                  </td>
                                  <td
                                    style={{
                                      ...tdStyle,
                                      fontSize: '11px',
                                      padding: '6px 8px',
                                      color: '#666',
                                    }}
                                  >
                                    {d.producto.numeroSerie}
                                  </td>
                                  <td
                                    style={{
                                      ...tdStyle,
                                      fontSize: '12px',
                                      padding: '6px 8px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {d.cantidad}
                                  </td>
                                  <td
                                    style={{
                                      ...tdStyle,
                                      fontSize: '12px',
                                      padding: '6px 8px',
                                      textAlign: 'right',
                                    }}
                                  >
                                    {fmtMXN(d.precioUnit)}
                                  </td>
                                  <td
                                    style={{
                                      ...tdStyle,
                                      fontSize: '12px',
                                      padding: '6px 8px',
                                      textAlign: 'right',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {fmtMXN(d.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Convert to Sale Modal ── */}
      {convertModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !converting) {
              setConvertModal(null)
              setActionError('')
            }
          }}
        >
          <div
            style={{
              background: '#111111',
              border: '1px solid #282828',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '460px',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #282828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#F0F0F0' }}>
                  Convertir a venta
                </span>
              </div>
              <button
                onClick={() => { setConvertModal(null); setActionError('') }}
                disabled={converting}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#555',
                  padding: '4px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>
              {/* Quote summary */}
              <div
                style={{
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '6px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#888' }}>Cotización</span>
                  <span style={{ color: '#ccc' }}>#{convertModal.id}</span>
                </div>
                {convertModal.nombreCliente && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#888' }}>Cliente</span>
                    <span style={{ color: '#ccc' }}>{convertModal.nombreCliente}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#888' }}>Sucursal</span>
                  <span style={{ color: '#ccc' }}>{convertModal.sucursal.nombre}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#888' }}>Productos</span>
                  <span style={{ color: '#ccc' }}>{convertModal.detalles.length}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #1a1a1a',
                  }}
                >
                  <span style={{ color: '#888', fontWeight: 600 }}>Total</span>
                  <span style={{ color: '#22C55E', fontWeight: 700, fontSize: '15px' }}>
                    {fmtMXN(convertModal.total)}
                  </span>
                </div>
              </div>

              {/* Payment method */}
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>
                Método de pago
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setMetodoPago('efectivo')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${metodoPago === 'efectivo' ? '#22C55E' : '#282828'}`,
                    background: metodoPago === 'efectivo' ? 'rgba(34,197,94,0.1)' : '#0a0a0a',
                    color: metodoPago === 'efectivo' ? '#22C55E' : '#888',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.12s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" /><line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                  Efectivo
                </button>
                <button
                  onClick={() => setMetodoPago('transferencia')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${metodoPago === 'transferencia' ? '#22C55E' : '#282828'}`,
                    background: metodoPago === 'transferencia' ? 'rgba(34,197,94,0.1)' : '#0a0a0a',
                    color: metodoPago === 'transferencia' ? '#22C55E' : '#888',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.12s',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                  </svg>
                  Transferencia
                </button>
              </div>

              {/* Clave rastreo */}
              {metodoPago === 'transferencia' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: 600 }}>
                    Clave de rastreo
                  </label>
                  <input
                    type="text"
                    value={claveRastreo}
                    onChange={(e) => setClaveRastreo(e.target.value)}
                    placeholder="Ej: 1234567890"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0a0a',
                      border: '1px solid #282828',
                      borderRadius: '6px',
                      color: '#F0F0F0',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {actionError && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#EF4444',
                    marginBottom: '16px',
                  }}
                >
                  {actionError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => { setConvertModal(null); setActionError('') }}
                  disabled={converting}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '6px',
                    border: '1px solid #282828',
                    background: 'transparent',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#22C55E',
                    color: '#fff',
                    cursor: converting ? 'wait' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    opacity: converting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  {converting ? (
                    'Procesando...'
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Confirmar venta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#888888',
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '13px',
  color: '#ccc',
}
