'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────

interface Producto {
  id: number
  numeroSerie: string
  nombre: string
  descripcion: string | null
  marca: string | null
  modelo: string | null
  color: string | null
  detalles: string | null
  precioUnitario: number
  stock: number
  sucursal: { nombre: string }
  otherBranch?: boolean
  otherBranchNombre?: string | null
}

interface ReceiptData {
  ventaId: number
  fecha: string
  cajero: string
  sucursal: string
  items: { nombre: string; numeroSerie: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  total: number
  metodoPago: string
  claveRastreo?: string
}

interface QuoteData {
  fecha: string
  vendedor: string
  sucursal: string
  nombreCliente: string
  items: { nombre: string; numeroSerie: string; marca: string | null; modelo: string | null; cantidad: number; precioUnitario: number; subtotal: number }[]
  total: number
}

interface Sucursal {
  id: number
  nombre: string
}

interface CartItem {
  productoId: number
  nombre: string
  numeroSerie: string
  precioUnitario: number
  cantidad: number
  stockDisponible: number
}

// ─── Helpers ─────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const METODOS = [
  {
    key: 'efectivo',
    label: 'Efectivo',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    key: 'transferencia',
    label: 'Transferencia',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
] as const

// ─── Product Card ─────────────────────────────────────────────

function ProductCard({
  producto,
  onAdd,
  onDetail,
  inCart,
}: {
  producto: Producto
  onAdd: (p: Producto) => void
  onDetail: (p: Producto) => void
  inCart: boolean
}) {
  const isOther = producto.otherBranch === true

  if (isOther) {
    return (
      <div
        style={{
          background: 'rgba(99,102,241,0.04)',
          border: '1px dashed rgba(99,102,241,0.35)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'left',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          opacity: 0.8,
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <button
              onClick={() => onDetail(producto)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#C7D2FE',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: 'underline',
                  textDecorationStyle: 'dotted',
                  textUnderlineOffset: '3px',
                }}
              >
                {producto.nombre}
              </div>
            </button>
            <div style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>
              SN: {producto.numeroSerie}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(99,102,241,0.15)',
                color: '#A5B4FC',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Otra sucursal
            </span>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {producto.marca && (
            <span className="badge badge-muted">{producto.marca}</span>
          )}
          {producto.modelo && (
            <span className="badge badge-muted">{producto.modelo}</span>
          )}
          {producto.color && (
            <span className="badge badge-muted">{producto.color}</span>
          )}
        </div>

        {/* Branch */}
        <div style={{ fontSize: '11px', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Disponible en {producto.otherBranchNombre}
        </div>

        {/* Price + stock */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '18px', color: '#818CF8' }}>
            {fmt(producto.precioUnitario)}
          </span>
          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>
            {producto.stock} en stock
          </span>
        </div>

        {/* Not available hint */}
        <div style={{ fontSize: '11px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          No disponible en esta sucursal
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: inCart ? 'rgba(245,158,11,0.06)' : '#0B1121',
        border: `1px solid ${inCart ? 'rgba(245,158,11,0.35)' : '#1C2B3F'}`,
        borderRadius: '10px',
        padding: '16px',
        textAlign: 'left',
        transition: 'border-color 0.15s',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <button
            onClick={() => onDetail(producto)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#E8EDFF',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '3px',
              }}
            >
              {producto.nombre}
            </div>
          </button>
          <div style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>
            SN: {producto.numeroSerie}
          </div>
        </div>
        {inCart && (
          <div style={{ flexShrink: 0 }}>
            <span className="badge badge-accent" style={{ fontSize: '10px' }}>En carrito</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {producto.marca && (
          <span className="badge badge-muted">{producto.marca}</span>
        )}
        {producto.modelo && (
          <span className="badge badge-muted">{producto.modelo}</span>
        )}
        {producto.color && (
          <span className="badge badge-muted">{producto.color}</span>
        )}
      </div>

      {/* Sucursal */}
      <div style={{ fontSize: '11px', color: '#8896B3', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        {producto.sucursal.nombre}
      </div>

      {/* Price + stock + add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-syne)',
              fontWeight: 800,
              fontSize: '18px',
              color: '#F59E0B',
            }}
          >
            {fmt(producto.precioUnitario)}
          </span>
          <div
            style={{
              fontSize: '11px',
              color: producto.stock <= 3 ? '#EF4444' : '#22C55E',
              fontWeight: 600,
              marginTop: '2px',
            }}
          >
            {producto.stock} en stock
          </div>
        </div>
        <button
          onClick={() => onAdd(producto)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 12px',
            background: inCart ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${inCart ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.25)'}`,
            borderRadius: '7px',
            color: '#F59E0B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.22)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.6)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = inCart ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = inCart ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.25)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {inCart ? 'Agregar otro' : 'Agregar'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function CajaPage() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<{ nombre: string; apellido: string; rol: string; sucursalId: number | null } | null>(null)
  const [sucursalNombre, setSucursalNombre] = useState<string | null>(null)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [selectedSucursalId, setSelectedSucursalId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [filterMarca, setFilterMarca] = useState('')
  const [filterModelo, setFilterModelo] = useState('')
  const [filterAnio, setFilterAnio] = useState('')
  const [marcasOptions, setMarcasOptions] = useState<string[]>([])
  const [modelosOptions, setModelosOptions] = useState<string[]>([])
  const [aniosOptions, setAniosOptions] = useState<number[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [metodo, setMetodo] = useState<'efectivo' | 'transferencia'>('efectivo')
  const [processing, setProcessing] = useState(false)
  const [saleSuccess, setSaleSuccess] = useState<number | null>(null)
  const [saleError, setSaleError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  const [cashGiven, setCashGiven] = useState('')
  const [claveRastreo, setClaveRastreo] = useState('')
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null)
  const [quoteClientName, setQuoteClientName] = useState('')
  const receiptIframeRef = useRef<HTMLIFrameElement>(null)
  const quoteIframeRef = useRef<HTMLIFrameElement>(null)

  // Load user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d) router.push('/login')
        else {
          setUser(d)
          // Fetch branches: admin needs the full list for switching; others just need name
          fetch('/api/admin/sucursales')
            .then(r => r.json())
            .then((list: Sucursal[]) => {
              if (d.rol === 'administrador') {
                setSucursales(list)
                // Default to first branch if admin has no assigned branch
                if (!d.sucursalId && list.length > 0) {
                  setSelectedSucursalId(list[0].id)
                  setSucursalNombre(list[0].nombre)
                } else if (d.sucursalId) {
                  setSelectedSucursalId(d.sucursalId)
                  const s = list.find((s: Sucursal) => s.id === d.sucursalId)
                  if (s) setSucursalNombre(s.nombre)
                }
              } else if (d.sucursalId) {
                const s = list.find((s: Sucursal) => s.id === d.sucursalId)
                if (s) setSucursalNombre(s.nombre)
              }
            })
            .catch(() => {})
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  // Load filter options
  useEffect(() => {
    fetch('/api/productos/filters')
      .then(r => r.json())
      .then((d: { marcas: string[]; modelos: string[]; anios: number[] }) => {
        setMarcasOptions(d.marcas ?? [])
        setModelosOptions(d.modelos ?? [])
        setAniosOptions(d.anios ?? [])
      })
      .catch(() => {})
  }, [])

  // Search
  const search = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q })
      if (selectedSucursalId) params.set('sucursalId', String(selectedSucursalId))
      if (filterMarca)  params.set('marca', filterMarca)
      if (filterModelo) params.set('modelo', filterModelo)
      if (filterAnio)   params.set('anio', filterAnio)
      const res = await fetch(`/api/productos?${params}`)
      const data = await res.json()
      setProductos(data)
    } finally {
      setLoading(false)
    }
  }, [selectedSucursalId, filterMarca, filterModelo, filterAnio])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // Initial load
  useEffect(() => {
    search('')
  }, [search])

  // Cart helpers
  function addToCart(p: Producto) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productoId === p.id)
      if (existing) {
        if (existing.cantidad >= p.stock) return prev
        return prev.map((i) => i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, {
        productoId: p.id,
        nombre: p.nombre,
        numeroSerie: p.numeroSerie,
        precioUnitario: p.precioUnitario,
        cantidad: 1,
        stockDisponible: p.stock,
      }]
    })
  }

  function updateQty(productoId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0)
    )
  }

  function removeItem(productoId: number) {
    setCart((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  function clearCart() {
    setCart([])
    setSaleSuccess(null)
    setSaleError('')
    setReceiptData(null)
  }

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0)
  const total = subtotal

  // Checkout
  async function handleCheckout() {
    setProcessing(true)
    setSaleError('')
    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productoId: i.productoId,
            nombre: i.nombre,
            precioUnitario: i.precioUnitario,
            cantidad: i.cantidad,
          })),
          metodoPago: metodo,
          claveRastreo: metodo === 'transferencia' ? claveRastreo : undefined,
          sucursalId: selectedSucursalId ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaleError(data.error || 'Error al procesar la venta')
        return
      }

      // Capture receipt data before clearing cart
      setReceiptData({
        ventaId: data.id,
        fecha: new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
        cajero: user ? `${user.nombre} ${user.apellido}` : '',
        sucursal: sucursalNombre ?? '',
        items: cart.map(i => ({
          nombre: i.nombre,
          numeroSerie: i.numeroSerie,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.precioUnitario * i.cantidad,
        })),
        total: cart.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0),
        metodoPago: metodo === 'efectivo' ? 'Efectivo' : 'Transferencia',
        claveRastreo: metodo === 'transferencia' && claveRastreo ? claveRastreo : undefined,
      })

      setSaleSuccess(data.id)
      setShowCheckout(false)
      setCashGiven('')
      setClaveRastreo('')
      setCart([])
      search(query) // refresh stock
    } catch {
      setSaleError('No se pudo completar la venta')
    } finally {
      setProcessing(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const cartIds = new Set(cart.map((i) => i.productoId))

  function buildReceiptHtml(r: ReceiptData): string {
    const fmtMXN = (n: number) =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

    const itemRows = r.items.map(i => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee;font-size:12px;">
          ${i.nombre}<br/>
          <span style="color:#888;font-size:10px;">SN: ${i.numeroSerie}</span>
        </td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px;">${i.cantidad}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:12px;">${fmtMXN(i.precioUnitario)}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;font-size:12px;font-weight:600;">${fmtMXN(i.subtotal)}</td>
      </tr>
    `).join('')

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket #${String(r.ventaId).padStart(4, '0')}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 16px; max-width: 320px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #222; }
    .header h1 { font-size: 18px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 2px; }
    .header p { font-size: 11px; color: #666; }
    .meta { margin-bottom: 14px; font-size: 11px; color: #444; }
    .meta div { display: flex; justify-content: space-between; padding: 2px 0; }
    .meta .label { color: #888; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    thead th { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.04em; padding-bottom: 6px; border-bottom: 2px solid #222; text-align: left; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    .totals { border-top: 2px solid #222; padding-top: 10px; margin-bottom: 14px; }
    .totals div { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
    .totals .grand { font-size: 18px; font-weight: 800; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 6px; }
    .payment { background: #f5f5f5; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px; font-size: 12px; }
    .payment .label { color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .footer { text-align: center; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 10px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Autopartes Guerrero</h1>
    <p>${r.sucursal}</p>
  </div>

  <div class="meta">
    <div><span class="label">Ticket</span><span>#${String(r.ventaId).padStart(4, '0')}</span></div>
    <div><span class="label">Fecha</span><span>${r.fecha}</span></div>
    <div><span class="label">Cajero</span><span>${r.cajero}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cant.</th>
        <th>P. Unit.</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="grand"><span>Total</span><span>${fmtMXN(r.total)}</span></div>
  </div>

  <div class="payment">
    <div class="label">Método de pago</div>
    <div style="font-weight:600;margin-top:2px;">${r.metodoPago}${r.claveRastreo ? ` — ${r.claveRastreo}` : ''}</div>
  </div>

  <div class="footer">
    <p>Gracias por su compra</p>
    <p style="margin-top:4px;">Este ticket es su comprobante de venta</p>
  </div>
</body>
</html>`
  }

  function handlePrintReceipt() {
    receiptIframeRef.current?.contentWindow?.print()
  }

  async function handleGenerateQuote() {
    if (cart.length === 0) return

    // Persist the quote to the database
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            precioUnit: i.precioUnitario,
            subtotal: i.precioUnitario * i.cantidad,
          })),
          sucursalId: selectedSucursalId ?? undefined,
          nombreCliente: quoteClientName.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Error al guardar la cotización')
        return
      }
    } catch {
      alert('Error de conexión al guardar la cotización')
      return
    }

    // Find full product info for each cart item (for marca/modelo)
    const productMap = new Map(productos.map(p => [p.id, p]))

    setQuoteData({
      fecha: new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }),
      vendedor: user ? `${user.nombre} ${user.apellido}` : '',
      sucursal: sucursalNombre ?? '',
      nombreCliente: quoteClientName.trim(),
      items: cart.map(i => {
        const prod = productMap.get(i.productoId)
        return {
          nombre: i.nombre,
          numeroSerie: i.numeroSerie,
          marca: prod?.marca ?? null,
          modelo: prod?.modelo ?? null,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          subtotal: i.precioUnitario * i.cantidad,
        }
      }),
      total: cart.reduce((s, i) => s + i.precioUnitario * i.cantidad, 0),
    })
    setCart([])
    setQuoteClientName('')
  }

  function buildQuoteHtml(q: QuoteData): string {
    const fmtMXN = (n: number) =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

    const itemRows = q.items.map((i, idx) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;font-size:12px;">
          <strong>${i.nombre}</strong><br/>
          <span style="color:#888;font-size:10px;">SN: ${i.numeroSerie}</span>
          ${i.marca || i.modelo ? `<br/><span style="color:#888;font-size:10px;">${[i.marca, i.modelo].filter(Boolean).join(' · ')}</span>` : ''}
        </td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-size:12px;">${i.cantidad}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:12px;">${fmtMXN(i.precioUnitario)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:12px;font-weight:600;">${fmtMXN(i.subtotal)}</td>
      </tr>
    `).join('')

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cotización — Autopartes Guerrero</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #222; }
    .header .brand h1 { font-size: 20px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .header .brand p { font-size: 11px; color: #666; margin-top: 2px; }
    .header .doc-type { text-align: right; }
    .header .doc-type h2 { font-size: 22px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.06em; }
    .header .doc-type p { font-size: 11px; color: #888; margin-top: 2px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 24px; font-size: 12px; }
    .meta .row { display: flex; justify-content: space-between; }
    .meta .label { color: #888; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead th { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.04em; padding: 8px 10px; border-bottom: 2px solid #222; text-align: left; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    .total-row { border-top: 3px solid #222; padding: 14px 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .total-row .label { font-size: 14px; font-weight: 700; }
    .total-row .amount { font-size: 24px; font-weight: 800; }
    .notice { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; font-size: 11px; color: #92400E; }
    .notice strong { display: block; margin-bottom: 2px; font-size: 12px; }
    .footer { text-align: center; padding-top: 16px; border-top: 1px dashed #ccc; font-size: 10px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Autopartes Guerrero</h1>
      <p>${q.sucursal}</p>
    </div>
    <div class="doc-type">
      <h2>Cotización</h2>
      <p>${q.fecha}</p>
    </div>
  </div>

  <div class="meta">
    ${q.nombreCliente ? `<div class="row"><span class="label">Cliente</span><span>${q.nombreCliente}</span></div>` : ''}
    <div class="row"><span class="label">Vendedor</span><span>${q.vendedor}</span></div>
    <div class="row"><span class="label">Artículos</span><span>${q.items.reduce((s, i) => s + i.cantidad, 0)}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cant.</th>
        <th>P. Unit.</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="total-row">
    <span class="label">Total</span>
    <span class="amount">${fmtMXN(q.total)}</span>
  </div>

  <div class="notice">
    <strong>Nota</strong>
    Esta cotización es informativa y no representa un compromiso de venta. Los precios y la disponibilidad están sujetos a cambio sin previo aviso.
  </div>

  <div class="footer">
    <p>Autopartes Guerrero — ${q.sucursal}</p>
    <p style="margin-top:4px;">Cotización generada el ${q.fecha}</p>
  </div>
</body>
</html>`
  }

  function handlePrintQuote() {
    quoteIframeRef.current?.contentWindow?.print()
  }

  async function handleDownloadQuote() {
    if (!quoteData) return

    // Clone the rendered iframe content into the main document so html2canvas can capture it
    const iframeDoc = quoteIframeRef.current?.contentDocument
    if (!iframeDoc?.body) return

    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '700px'
    container.style.zIndex = '-9999'
    container.style.opacity = '0'
    container.style.pointerEvents = 'none'
    container.style.background = '#fff'

    // Copy styles from iframe
    const styles = iframeDoc.querySelectorAll('style')
    styles.forEach(s => container.appendChild(s.cloneNode(true)))

    // Copy body content
    const content = document.createElement('div')
    content.innerHTML = iframeDoc.body.innerHTML
    // Copy body styles
    const bodyStyles = iframeDoc.defaultView?.getComputedStyle(iframeDoc.body)
    if (bodyStyles) {
      content.style.fontFamily = bodyStyles.fontFamily
      content.style.color = bodyStyles.color
      content.style.padding = bodyStyles.padding
      content.style.maxWidth = '700px'
      content.style.margin = '0 auto'
    }
    container.appendChild(content)
    document.body.appendChild(container)

    // Wait a frame for styles to apply
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    const html2pdf = (await import('html2pdf.js')).default
    const clientPart = quoteData.nombreCliente ? `_${quoteData.nombreCliente.replace(/\s+/g, '_')}` : ''
    const filename = `Cotizacion${clientPart}_${new Date().toISOString().slice(0, 10)}.pdf`

    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, width: 700 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(content).save()

    document.body.removeChild(container)
  }

  function handleWhatsAppQuote() {
    if (!quoteData) return
    const fmtMXN = (n: number) =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

    const lines: string[] = []
    lines.push('*AUTOPARTES GUERRERO*')
    lines.push(`_Cotización — ${quoteData.fecha}_`)
    if (quoteData.nombreCliente) lines.push(`Cliente: ${quoteData.nombreCliente}`)
    lines.push(`Sucursal: ${quoteData.sucursal}`)
    lines.push(`Vendedor: ${quoteData.vendedor}`)
    lines.push('')
    lines.push('─────────────────')
    quoteData.items.forEach((item, idx) => {
      lines.push(`*${idx + 1}. ${item.nombre}*`)
      if (item.marca || item.modelo) lines.push(`   ${[item.marca, item.modelo].filter(Boolean).join(' · ')}`)
      lines.push(`   SN: ${item.numeroSerie}`)
      lines.push(`   ${item.cantidad} × ${fmtMXN(item.precioUnitario)} = ${fmtMXN(item.subtotal)}`)
      lines.push('')
    })
    lines.push('─────────────────')
    lines.push(`*Total: ${fmtMXN(quoteData.total)}*`)
    lines.push('')
    lines.push('_Precios sujetos a cambio sin previo aviso. Esta cotización no representa un compromiso de venta._')

    const text = encodeURIComponent(lines.join('\n'))
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#060A12', overflow: 'hidden' }}>
      {/* ── Top bar ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          background: '#0B1121',
          borderBottom: '1px solid #1C2B3F',
          flexShrink: 0,
          gap: '16px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: '16px',
            letterSpacing: '0.1em',
            color: '#F59E0B',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Autopartes Guerrero
        </span>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: '560px', position: 'relative' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8896B3', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            type="search"
            className="input-base"
            placeholder="Buscar por nombre, serie, marca o modelo..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '42px', paddingRight: '14px' }}
            autoFocus
          />
        </div>

        {/* User & actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {user && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF' }}>
                {user.nombre} {user.apellido}
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '3px', alignItems: 'center' }}>
                <span className="badge badge-success" style={{ fontSize: '10px' }}>{user.rol}</span>
                {user.rol === 'administrador' && sucursales.length > 0 ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#8896B3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '6px', pointerEvents: 'none' }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    <select
                      value={selectedSucursalId ?? ''}
                      onChange={(e) => {
                        const id = Number(e.target.value)
                        setSelectedSucursalId(id)
                        const s = sucursales.find(s => s.id === id)
                        setSucursalNombre(s?.nombre ?? null)
                        setCart([])
                      }}
                      style={{
                        appearance: 'none',
                        background: '#111827',
                        border: '1px solid #1C2B3F',
                        borderRadius: '4px',
                        color: '#8896B3',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 18px 2px 20px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        lineHeight: 1.4,
                      }}
                    >
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#8896B3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '5px', pointerEvents: 'none' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                ) : sucursalNombre ? (
                  <span className="badge badge-muted" style={{ fontSize: '10px' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px' }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    {sucursalNombre}
                  </span>
                ) : null}
              </div>
            </div>
          )}
          <a
            href="/caja/cotizaciones"
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '7px 12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Cotizaciones
          </a>
          <a
            href="/caja/corte"
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '7px 12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Corte de caja
          </a>
          {user?.rol !== 'cajero' && (
            <a
              href="/admin"
              className="btn-ghost"
              style={{ fontSize: '12px', padding: '7px 12px' }}
            >
              Admin
            </a>
          )}
          <button onClick={handleLogout} className="btn-ghost" style={{ fontSize: '12px', padding: '7px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      {/* ── Filters bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 24px',
          background: '#0A0F1A',
          borderBottom: '1px solid #1C2B3F',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8896B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        <span style={{ fontSize: '11px', color: '#8896B3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
          Filtros
        </span>

        {/* Brand */}
        <select
          value={filterMarca}
          onChange={(e) => setFilterMarca(e.target.value)}
          style={{
            appearance: 'none',
            background: '#111827',
            border: '1px solid #1C2B3F',
            borderRadius: '6px',
            color: filterMarca ? '#E8EDFF' : '#8896B3',
            fontSize: '12px',
            padding: '5px 24px 5px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238896B3' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="">Marca</option>
          {marcasOptions.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Model */}
        <select
          value={filterModelo}
          onChange={(e) => setFilterModelo(e.target.value)}
          style={{
            appearance: 'none',
            background: '#111827',
            border: '1px solid #1C2B3F',
            borderRadius: '6px',
            color: filterModelo ? '#E8EDFF' : '#8896B3',
            fontSize: '12px',
            padding: '5px 24px 5px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238896B3' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="">Modelo</option>
          {modelosOptions.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={filterAnio}
          onChange={(e) => setFilterAnio(e.target.value)}
          style={{
            appearance: 'none',
            background: '#111827',
            border: '1px solid #1C2B3F',
            borderRadius: '6px',
            color: filterAnio ? '#E8EDFF' : '#8896B3',
            fontSize: '12px',
            padding: '5px 24px 5px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238896B3' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="">Año</option>
          {aniosOptions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Clear filters */}
        {(filterMarca || filterModelo || filterAnio) && (
          <button
            onClick={() => { setFilterMarca(''); setFilterModelo(''); setFilterAnio('') }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8896B3',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
              fontFamily: 'inherit',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Products panel ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {/* Success banner */}
          {saleSuccess && (
            <div
              style={{
                padding: '14px 18px',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                color: '#22C55E',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>
                <strong>Venta #{String(saleSuccess).padStart(4, '0')}</strong> registrada con éxito.
              </span>
              <button
                onClick={clearCart}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', fontSize: '13px', textDecoration: 'underline' }}
              >
                Nueva venta
              </button>
            </div>
          )}

          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#374151' }}>
              {loading ? 'Buscando...' : `${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`}
            </p>
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Limpiar
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#374151', gap: '12px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Buscando productos...
            </div>
          ) : productos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#374151' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
              <p style={{ fontSize: '14px' }}>No se encontraron productos</p>
              {query && <p style={{ fontSize: '12px', marginTop: '4px' }}>Intenta con otros términos de búsqueda</p>}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {productos.map((p) => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  onAdd={addToCart}
                  onDetail={setSelectedProduct}
                  inCart={cartIds.has(p.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Cart panel ── */}
        <aside
          style={{
            width: '340px',
            flexShrink: 0,
            background: '#0B1121',
            borderLeft: '1px solid #1C2B3F',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Cart header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1C2B3F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F59E0B' }}>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#E8EDFF' }}>
                Carrito
              </span>
              {cart.length > 0 && (
                <span
                  style={{
                    background: '#F59E0B',
                    color: '#060A12',
                    fontWeight: 800,
                    fontSize: '11px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cart.reduce((s, i) => s + i.cantidad, 0)}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn-danger" style={{ fontSize: '11px', padding: '4px 10px' }}>
                Vaciar
              </button>
            )}
          </div>

          {/* Cart items */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#374151' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛒</div>
                <p style={{ fontSize: '13px' }}>El carrito está vacío</p>
                <p style={{ fontSize: '12px', marginTop: '6px' }}>Usa el botón Agregar en cada producto</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map((item) => (
                  <div
                    key={item.productoId}
                    style={{
                      background: '#111827',
                      border: '1px solid #1C2B3F',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.nombre}
                        </div>
                        <div style={{ fontSize: '10px', color: '#374151', marginTop: '2px' }}>SN: {item.numeroSerie}</div>
                      </div>
                      <button
                        onClick={() => removeItem(item.productoId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '2px', flexShrink: 0, marginLeft: '8px' }}
                        aria-label="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Qty controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => updateQty(item.productoId, -1)}
                          style={{
                            width: '26px',
                            height: '26px',
                            border: '1px solid #1C2B3F',
                            borderRadius: '6px',
                            background: '#0B1121',
                            color: '#8896B3',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            lineHeight: 1,
                          }}
                        >
                          −
                        </button>
                        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: '#E8EDFF', minWidth: '20px', textAlign: 'center' }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => updateQty(item.productoId, 1)}
                          disabled={item.cantidad >= item.stockDisponible}
                          style={{
                            width: '26px',
                            height: '26px',
                            border: '1px solid #1C2B3F',
                            borderRadius: '6px',
                            background: item.cantidad >= item.stockDisponible ? '#0B1121' : '#0B1121',
                            color: item.cantidad >= item.stockDisponible ? '#374151' : '#8896B3',
                            cursor: item.cantidad >= item.stockDisponible ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            lineHeight: 1,
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: '#F59E0B' }}>
                          {fmt(item.precioUnitario * item.cantidad)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#374151' }}>
                          {fmt(item.precioUnitario)} c/u
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart footer */}
          {cart.length > 0 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #1C2B3F' }}>
              {/* Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: '#E8EDFF' }}>
                    Total
                  </span>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '20px', color: '#22C55E' }}>
                    {fmt(total)}
                  </span>
                </div>
              </div>

              {saleError && (
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#EF4444',
                    marginBottom: '12px',
                  }}
                >
                  {saleError}
                </div>
              )}

              {/* Customer name for quote */}
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Nombre del cliente (opcional)"
                  value={quoteClientName}
                  onChange={(e) => setQuoteClientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: '#E8EDFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleGenerateQuote}
                  className="btn-ghost"
                  style={{ flex: 1, fontSize: '13px', padding: '12px', justifyContent: 'center' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  Cotizar
                </button>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="btn-accent"
                  style={{ flex: 2, fontSize: '15px', padding: '14px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Cobrar {fmt(total)}
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Checkout Modal ── */}
      {showCheckout && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6,10,18,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCheckout(false); setCashGiven(''); setClaveRastreo('') } }}
        >
          <div
            className="card animate-fade-up"
            style={{ width: '100%', maxWidth: '780px', padding: '36px', position: 'relative' }}
          >
            <button
              onClick={() => { setShowCheckout(false); setCashGiven(''); setClaveRastreo('') }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '22px', color: '#E8EDFF', marginBottom: '4px' }}>
                Confirmar venta
              </h2>
              <p style={{ fontSize: '13px', color: '#8896B3' }}>
                {cart.reduce((s, i) => s + i.cantidad, 0)} artículo{cart.reduce((s, i) => s + i.cantidad, 0) !== 1 ? 's' : ''} · Total: <strong style={{ color: '#22C55E' }}>{fmt(total)}</strong>
              </p>
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>

              {/* ── Left: items list ── */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                  Artículos
                </p>
                <div
                  style={{
                    background: '#111827',
                    border: '1px solid #1C2B3F',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '340px',
                  }}
                >
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', padding: '10px 14px', borderBottom: '1px solid #1C2B3F' }}>
                    <span style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</span>
                    <span style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Cant.</span>
                    <span style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Importe</span>
                  </div>
                  {cart.map((item, idx) => (
                    <div
                      key={item.productoId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: '12px',
                        padding: '11px 14px',
                        borderBottom: idx < cart.length - 1 ? '1px solid #1C2B3F' : 'none',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', color: '#E8EDFF', fontWeight: 500, lineHeight: 1.3 }}>{item.nombre}</div>
                        <div style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>
                          SN: {item.numeroSerie} · {fmt(item.precioUnitario)} c/u
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', color: '#8896B3', textAlign: 'center', fontWeight: 600 }}>×{item.cantidad}</span>
                      <span style={{ fontSize: '14px', color: '#F59E0B', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {fmt(item.precioUnitario * item.cantidad)}
                      </span>
                    </div>
                  ))}
                  {/* Subtotals */}
                  <div style={{ borderTop: '2px solid #1C2B3F', padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '14px', color: '#E8EDFF' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '18px', color: '#22C55E' }}>{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Right: payment + cash + confirm ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Payment method */}
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Método de pago
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {METODOS.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => { setMetodo(m.key); setCashGiven(''); setClaveRastreo('') }}
                        style={{
                          flex: 1,
                          padding: '14px 8px',
                          background: metodo === m.key ? 'rgba(245,158,11,0.1)' : '#111827',
                          border: `2px solid ${metodo === m.key ? '#F59E0B' : '#1C2B3F'}`,
                          borderRadius: '10px',
                          color: metodo === m.key ? '#F59E0B' : '#8896B3',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clave de rastreo (transferencia) */}
                {metodo === 'transferencia' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                      Clave de rastreo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. SPEI123456789"
                      value={claveRastreo}
                      onChange={(e) => setClaveRastreo(e.target.value)}
                      className="input-base"
                      autoFocus
                      style={{ fontFamily: 'var(--font-syne)', fontWeight: 600, fontSize: '15px', letterSpacing: '0.04em' }}
                    />
                    <p style={{ fontSize: '11px', color: '#374151', marginTop: '6px' }}>
                      Opcional — se guarda junto con la venta para referencia.
                    </p>
                  </div>
                )}

                {/* Cash given + change */}
                {metodo === 'efectivo' && (() => {
                  const given = parseFloat(cashGiven)
                  const change = !isNaN(given) && given >= total ? given - total : null
                  const insufficient = !isNaN(given) && given < total
                  return (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>
                        Efectivo recibido
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8896B3', fontSize: '14px', fontWeight: 600, pointerEvents: 'none' }}>$</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder={`Mín. ${total.toFixed(2)}`}
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          className="input-base"
                          style={{ paddingLeft: '28px', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '18px' }}
                          autoFocus
                        />
                      </div>
                      {insufficient && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Monto insuficiente — faltan {fmt(total - given)}
                        </div>
                      )}
                      {change !== null && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '14px 16px',
                            background: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: '13px', color: '#8896B3' }}>Cambio a devolver</span>
                          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#22C55E' }}>{fmt(change)}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Total to charge */}
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total a cobrar</div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '36px', color: '#22C55E' }}>{fmt(total)}</div>
                </div>

                {/* Confirm button */}
                <button
                  onClick={handleCheckout}
                  className="btn-accent"
                  disabled={processing || (metodo === 'efectivo' && cashGiven !== '' && parseFloat(cashGiven) < total)}
                  style={{ width: '100%', fontSize: '16px', padding: '15px' }}
                >
                  {processing ? (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
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

      {/* Product detail modal */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6,10,18,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null) }}
        >
          <div className="card animate-fade-up" style={{ width: '100%', maxWidth: '480px', padding: '32px', position: 'relative' }}>
            <button
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '20px', color: '#E8EDFF', marginBottom: '20px', paddingRight: '24px' }}>
              {selectedProduct.nombre}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Número de serie', value: selectedProduct.numeroSerie },
                { label: 'Marca', value: selectedProduct.marca },
                { label: 'Modelo', value: selectedProduct.modelo },
                { label: 'Color', value: selectedProduct.color },
                { label: 'Sucursal', value: selectedProduct.sucursal.nombre },
                { label: 'Stock disponible', value: String(selectedProduct.stock) },
              ].filter((r) => r.value).map((row) => (
                <div key={row.label}>
                  <div style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{row.label}</div>
                  <div style={{ fontSize: '13px', color: '#E8EDFF', fontWeight: 500 }}>{row.value}</div>
                </div>
              ))}
            </div>
            {selectedProduct.descripcion && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Descripción</div>
                <p style={{ fontSize: '13px', color: '#8896B3', lineHeight: 1.6 }}>{selectedProduct.descripcion}</p>
              </div>
            )}
            {selectedProduct.detalles && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Detalles adicionales</div>
                <p style={{ fontSize: '13px', color: '#8896B3', lineHeight: 1.6 }}>{selectedProduct.detalles}</p>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #1C2B3F' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>Precio unitario</div>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '28px', color: '#F59E0B' }}>{fmt(selectedProduct.precioUnitario)}</div>
              </div>
              <button
                className="btn-accent"
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receiptData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6,10,18,0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setReceiptData(null) }}
        >
          <div
            className="animate-fade-up"
            style={{
              background: '#0B1121',
              border: '1px solid #1C2B3F',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '420px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: '90vh',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #1C2B3F',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: '#E8EDFF' }}>
                  Ticket #{String(receiptData.ventaId).padStart(4, '0')}
                </span>
              </div>
              <button
                onClick={() => setReceiptData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '4px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Receipt iframe */}
            <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
              <iframe
                ref={receiptIframeRef}
                srcDoc={buildReceiptHtml(receiptData)}
                style={{ width: '100%', height: '560px', border: 'none' }}
                title="Ticket de venta"
              />
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '16px 20px',
              borderTop: '1px solid #1C2B3F',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setReceiptData(null)}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '13px', padding: '11px', justifyContent: 'center' }}
              >
                Cerrar
              </button>
              <button
                onClick={handlePrintReceipt}
                className="btn-accent"
                style={{ flex: 1, fontSize: '13px', padding: '11px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quote Modal ── */}
      {quoteData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6,10,18,0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setQuoteData(null) }}
        >
          <div
            className="animate-fade-up"
            style={{
              background: '#0B1121',
              border: '1px solid #1C2B3F',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: '90vh',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #1C2B3F',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '15px', color: '#E8EDFF' }}>
                  Cotización
                </span>
              </div>
              <button
                onClick={() => setQuoteData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: '4px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Quote iframe */}
            <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
              <iframe
                ref={quoteIframeRef}
                srcDoc={buildQuoteHtml(quoteData)}
                style={{ width: '100%', height: '600px', border: 'none' }}
                title="Cotización"
              />
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '16px 20px',
              borderTop: '1px solid #1C2B3F',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setQuoteData(null)}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '13px', padding: '11px', justifyContent: 'center' }}
              >
                Cerrar
              </button>
              <button
                onClick={handleDownloadQuote}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '12px', padding: '11px', justifyContent: 'center' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar
              </button>
              <button
                onClick={handleWhatsAppQuote}
                style={{
                  flex: 1,
                  fontSize: '12px',
                  padding: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handlePrintQuote}
                className="btn-accent"
                style={{ flex: 1, fontSize: '12px', padding: '11px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
