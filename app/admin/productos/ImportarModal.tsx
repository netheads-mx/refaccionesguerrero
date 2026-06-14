'use client'

import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react'
import * as XLSX from 'xlsx'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Sucursal { id: number; nombre: string }

interface ParsedRow {
  serie: string
  cantidad: number | string
  nombre: string
  marca: string
  modelo: string
  precio: number | string
  desde: number | string
  hasta: number | string
  sucursal: string
}

interface ClientError {
  row: number
  errors: string[]
}

interface ServerRowResult {
  row: number
  serie: string
  status: 'ok' | 'error'
  error?: string
}

interface UploadResult {
  results: ServerRowResult[]
  summary: { total: number; created: number; errors: number }
}

type Step = 'pick' | 'preview' | 'uploading' | 'done'

// Column name aliases — we normalise to lowercase and match any of these
const COL_MAP: Record<string, string> = {
  serie: 'serie', 'n° serie': 'serie', 'numero serie': 'serie', 'número serie': 'serie', 'numero_serie': 'serie',
  cantidad: 'cantidad', stock: 'cantidad', qty: 'cantidad',
  nombre: 'nombre', name: 'nombre', producto: 'nombre',
  marca: 'marca', brand: 'marca',
  modelo: 'modelo', model: 'modelo',
  precio: 'precio', price: 'precio', 'precio unitario': 'precio', 'precio_unitario': 'precio',
  desde: 'desde', 'año desde': 'desde', 'anio_inicio': 'desde', 'año inicio': 'desde',
  hasta: 'hasta', 'año hasta': 'hasta', 'anio_fin': 'hasta', 'año fin': 'hasta',
  sucursal: 'sucursal', branch: 'sucursal', tienda: 'sucursal',
}

const REQUIRED_COLS = ['serie', 'cantidad', 'nombre', 'marca', 'modelo', 'precio', 'desde', 'hasta', 'sucursal']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseHeaders(raw: string[]): { mapped: Record<string, number>; missing: string[] } {
  const mapped: Record<string, number> = {}
  for (let i = 0; i < raw.length; i++) {
    const key = raw[i]?.toString().trim().toLowerCase()
    const canon = COL_MAP[key]
    if (canon && !(canon in mapped)) mapped[canon] = i
  }
  const missing = REQUIRED_COLS.filter(c => !(c in mapped))
  return { mapped, missing }
}

function parseFile(data: ArrayBuffer): { rows: ParsedRow[]; headerError?: string } {
  const wb = XLSX.read(data, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return { rows: [], headerError: 'El archivo no contiene hojas' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (json.length < 2) return { rows: [], headerError: 'El archivo no contiene datos (se requiere al menos una fila de encabezado y una de datos)' }

  const rawHeaders = (json[0] as string[]).map(h => String(h))
  const { mapped, missing } = normaliseHeaders(rawHeaders)
  if (missing.length > 0) {
    return { rows: [], headerError: `Columnas faltantes: ${missing.join(', ')}` }
  }

  const rows: ParsedRow[] = []
  for (let i = 1; i < json.length; i++) {
    const r = json[i]
    // Skip completely empty rows
    if (!r || r.every((c: unknown) => c === '' || c == null)) continue
    rows.push({
      serie:    String(r[mapped.serie]    ?? '').trim(),
      cantidad: r[mapped.cantidad] ?? '',
      nombre:   String(r[mapped.nombre]   ?? '').trim(),
      marca:    String(r[mapped.marca]    ?? '').trim(),
      modelo:   String(r[mapped.modelo]   ?? '').trim(),
      precio:   r[mapped.precio] ?? '',
      desde:    r[mapped.desde]  ?? '',
      hasta:    r[mapped.hasta]  ?? '',
      sucursal: String(r[mapped.sucursal] ?? '').trim(),
    })
  }
  return { rows }
}

function validateClient(rows: ParsedRow[], sucursalNames: Set<string>): ClientError[] {
  const errors: ClientError[] = []
  const seriesSeen = new Map<string, number>()

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const rowErrors: string[] = []

    // Empty checks
    if (!r.serie) rowErrors.push('serie vacío')
    if (r.cantidad === '' || r.cantidad == null) rowErrors.push('cantidad vacía')
    if (!r.nombre) rowErrors.push('nombre vacío')
    if (!r.marca) rowErrors.push('marca vacía')
    if (!r.modelo) rowErrors.push('modelo vacío')
    if (r.precio === '' || r.precio == null) rowErrors.push('precio vacío')
    if (r.desde === '' || r.desde == null) rowErrors.push('desde vacío')
    if (r.hasta === '' || r.hasta == null) rowErrors.push('hasta vacío')
    if (!r.sucursal) rowErrors.push('sucursal vacía')

    // Numeric checks
    const cantidad = Number(r.cantidad)
    const precio = Number(r.precio)
    const desde = Number(r.desde)
    const hasta = Number(r.hasta)

    if (r.cantidad !== '' && (isNaN(cantidad) || cantidad < 0 || !Number.isInteger(cantidad)))
      rowErrors.push('cantidad debe ser un entero ≥ 0')
    if (r.precio !== '' && (isNaN(precio) || precio < 0))
      rowErrors.push('precio inválido')
    if (r.desde !== '' && (isNaN(desde) || !Number.isInteger(desde)))
      rowErrors.push('"desde" debe ser un año válido')
    if (r.hasta !== '' && (isNaN(hasta) || !Number.isInteger(hasta)))
      rowErrors.push('"hasta" debe ser un año válido')

    // desde <= hasta
    if (r.desde !== '' && r.hasta !== '' && !isNaN(desde) && !isNaN(hasta) && desde > hasta)
      rowErrors.push(`"desde" (${desde}) debe ser ≤ "hasta" (${hasta})`)

    // Validate sucursal name
    if (r.sucursal && !sucursalNames.has(r.sucursal.toLowerCase()))
      rowErrors.push(`Sucursal "${r.sucursal}" no existe`)

    // Duplicate within file
    if (r.serie) {
      const key = r.serie.toLowerCase()
      if (seriesSeen.has(key))
        rowErrors.push(`serie duplicada (misma que fila ${seriesSeen.get(key)})`)
      else
        seriesSeen.set(key, rowNum)
    }

    if (rowErrors.length > 0) errors.push({ row: rowNum, errors: rowErrors })
  }
  return errors
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)
const FileIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onDone: () => void
}

export function ImportarModal({ open, onClose, onDone }: Props) {
  const [step, setStep]                 = useState<Step>('pick')
  const [fileName, setFileName]         = useState('')
  const [rows, setRows]                 = useState<ParsedRow[]>([])
  const [clientErrors, setClientErrors] = useState<ClientError[]>([])
  const [headerError, setHeaderError]   = useState('')
  const [sucursales, setSucursales]     = useState<Sucursal[]>([])
  const [serverResult, setServerResult] = useState<UploadResult | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [dragOver, setDragOver]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Fetch sucursales when modal opens
  const fetchSucursales = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sucursales')
      const data = await res.json()
      setSucursales(Array.isArray(data) ? data : data.data ?? [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (open) fetchSucursales()
  }, [open, fetchSucursales])

  // Reset state
  function reset() {
    setStep('pick')
    setFileName('')
    setRows([])
    setClientErrors([])
    setHeaderError('')
    setServerResult(null)
  }

  if (!open) return null

  const sucursalNames = new Set(sucursales.map(s => s.nombre.toLowerCase()))

  function processFile(file: File) {
    setHeaderError('')
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result as ArrayBuffer
      const { rows: parsed, headerError: hErr } = parseFile(data)
      if (hErr) {
        setHeaderError(hErr)
        return
      }
      setRows(parsed)
      const errs = validateClient(parsed, sucursalNames)
      setClientErrors(errs)
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  async function handleUpload() {
    setUploading(true)
    setStep('uploading')
    try {
      const res = await fetch('/api/admin/productos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data: UploadResult = await res.json()
      setServerResult(data)
      setStep('done')
    } catch {
      setStep('preview')
    } finally {
      setUploading(false)
    }
  }

  function handleClose() {
    if (step === 'done') onDone()
    reset()
    onClose()
  }

  const hasClientErrors = clientErrors.length > 0
  const clientErrorRows = new Set(clientErrors.map(e => e.row))

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', pointerEvents: 'none',
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            background: '#0D1526', border: '1px solid #1C2B3F', borderRadius: '12px',
            width: '100%', maxWidth: step === 'pick' ? '560px' : '960px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            transition: 'max-width 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid #1C2B3F', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UploadIcon />
              <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '16px', color: '#E8EDFF', margin: 0 }}>
                Importar productos
              </h2>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', display: 'flex' }}>
              <CloseIcon />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

            {/* ─── Step: Pick file ─── */}
            {step === 'pick' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragOver ? '#F59E0B' : '#1C2B3F'}`,
                    borderRadius: '10px', padding: '48px 24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    background: dragOver ? 'rgba(245,158,11,0.04)' : 'transparent',
                  }}
                >
                  <div style={{ color: dragOver ? '#F59E0B' : '#374151' }}><FileIcon /></div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#E8EDFF' }}>
                    Arrastra tu archivo aquí o haz clic para seleccionar
                  </div>
                  <div style={{ fontSize: '12px', color: '#8896B3' }}>
                    Formatos aceptados: .xlsx, .xls, .csv
                  </div>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {headerError && (
                  <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: '#EF4444' }}>
                    {headerError}
                  </div>
                )}

                <div style={{ background: '#0B1121', border: '1px solid #1C2B3F', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                    Columnas requeridas
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { col: 'serie', desc: 'N° de serie' },
                      { col: 'cantidad', desc: 'Stock' },
                      { col: 'nombre', desc: 'Nombre' },
                      { col: 'marca', desc: 'Marca del auto' },
                      { col: 'modelo', desc: 'Modelo del auto' },
                      { col: 'precio', desc: 'Precio unitario' },
                      { col: 'desde', desc: 'Año inicio' },
                      { col: 'hasta', desc: 'Año fin' },
                      { col: 'sucursal', desc: 'Nombre de la sucursal' },
                    ].map(c => (
                      <div key={c.col} style={{ fontSize: '12px', padding: '6px 8px', background: '#0D1526', borderRadius: '4px' }}>
                        <code style={{ color: '#F59E0B', fontFamily: 'monospace' }}>{c.col}</code>
                        <div style={{ color: '#8896B3', fontSize: '11px', marginTop: '2px' }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step: Preview ─── */}
            {step === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* File info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#8896B3' }}>Archivo:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF' }}>{fileName}</span>
                  <span style={{ fontSize: '12px', color: '#374151' }}>({rows.length} fila{rows.length !== 1 ? 's' : ''})</span>
                  <button
                    onClick={() => reset()}
                    style={{ fontSize: '12px', color: '#F59E0B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Cambiar archivo
                  </button>
                </div>

                {/* Validation summary */}
                {hasClientErrors && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertIcon />
                    {clientErrors.length} fila{clientErrors.length !== 1 ? 's' : ''} con errores de validación. Corrígelas en el archivo y vuelve a cargarlo.
                  </div>
                )}
                {!hasClientErrors && (
                  <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', fontSize: '13px', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckIcon />
                    Todas las filas pasan la validación local. La marca/modelo se validará al importar.
                  </div>
                )}

                {/* Preview table */}
                <div style={{ overflowX: 'auto', border: '1px solid #1C2B3F', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ background: '#0B1121', borderBottom: '1px solid #1C2B3F' }}>
                        {['#', 'Serie', 'Nombre', 'Marca', 'Modelo', 'Cant.', 'Precio', 'Desde', 'Hasta', 'Sucursal', 'Estado'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const rowNum = i + 2
                        const errObj = clientErrors.find(e => e.row === rowNum)
                        const hasErr = !!errObj
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #1C2B3F', background: hasErr ? 'rgba(239,68,68,0.04)' : 'transparent' }} title={hasErr ? errObj.errors.join('; ') : ''}>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#374151' }}>{rowNum}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#E8EDFF', fontFamily: 'monospace' }}>{r.serie || <span style={{ color: '#EF4444' }}>—</span>}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#E8EDFF', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre || <span style={{ color: '#EF4444' }}>—</span>}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#8896B3' }}>{r.marca || <span style={{ color: '#EF4444' }}>—</span>}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#8896B3' }}>{r.modelo || <span style={{ color: '#EF4444' }}>—</span>}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#8896B3', textAlign: 'right' }}>{String(r.cantidad)}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#F59E0B', fontFamily: 'var(--font-syne)', textAlign: 'right' }}>{String(r.precio)}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#8896B3', textAlign: 'center' }}>{String(r.desde)}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: '#8896B3', textAlign: 'center' }}>{String(r.hasta)}</td>
                            <td style={{ padding: '7px 10px', fontSize: '12px', color: r.sucursal && sucursalNames.has(r.sucursal.toLowerCase()) ? '#8896B3' : '#EF4444' }}>
                              {r.sucursal || <span style={{ color: '#EF4444' }}>—</span>}
                            </td>
                            <td style={{ padding: '7px 10px' }}>
                              {hasErr ? (
                                <span title={errObj.errors.join('\n')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#EF4444', cursor: 'help' }}>
                                  <AlertIcon /> Error
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#22C55E' }}>
                                  <CheckIcon /> OK
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Error details */}
                {hasClientErrors && (
                  <details style={{ background: '#0B1121', border: '1px solid #1C2B3F', borderRadius: '8px', padding: '12px 16px' }}>
                    <summary style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}>
                      Ver detalle de errores ({clientErrors.length})
                    </summary>
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {clientErrors.map(e => (
                        <div key={e.row} style={{ fontSize: '12px', color: '#8896B3' }}>
                          <strong style={{ color: '#EF4444' }}>Fila {e.row}:</strong> {e.errors.join('; ')}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* ─── Step: Uploading ─── */}
            {step === 'uploading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                <Spinner />
                <div style={{ fontSize: '14px', color: '#E8EDFF' }}>Importando {rows.length} producto{rows.length !== 1 ? 's' : ''}…</div>
                <div style={{ fontSize: '12px', color: '#8896B3' }}>Validando marca/modelo, sucursal y creando productos</div>
              </div>
            )}

            {/* ─── Step: Done ─── */}
            {step === 'done' && serverResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Summary */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, padding: '16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '28px', fontWeight: 700, color: '#22C55E' }}>{serverResult.summary.created}</div>
                    <div style={{ fontSize: '12px', color: '#8896B3' }}>Creados</div>
                  </div>
                  <div style={{ flex: 1, padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '28px', fontWeight: 700, color: '#EF4444' }}>{serverResult.summary.errors}</div>
                    <div style={{ fontSize: '12px', color: '#8896B3' }}>Errores</div>
                  </div>
                  <div style={{ flex: 1, padding: '16px', background: '#0B1121', border: '1px solid #1C2B3F', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-syne)', fontSize: '28px', fontWeight: 700, color: '#E8EDFF' }}>{serverResult.summary.total}</div>
                    <div style={{ fontSize: '12px', color: '#8896B3' }}>Total</div>
                  </div>
                </div>

                {/* Results table */}
                {serverResult.summary.errors > 0 && (
                  <div style={{ overflowX: 'auto', border: '1px solid #1C2B3F', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#0B1121', borderBottom: '1px solid #1C2B3F' }}>
                          {['Fila', 'Serie', 'Estado', 'Detalle'].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {serverResult.results.filter(r => r.status === 'error').map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #1C2B3F', background: 'rgba(239,68,68,0.04)' }}>
                            <td style={{ padding: '7px 12px', fontSize: '12px', color: '#374151' }}>{r.row}</td>
                            <td style={{ padding: '7px 12px', fontSize: '12px', color: '#E8EDFF', fontFamily: 'monospace' }}>{r.serie}</td>
                            <td style={{ padding: '7px 12px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#EF4444' }}>
                                <AlertIcon /> Error
                              </span>
                            </td>
                            <td style={{ padding: '7px 12px', fontSize: '12px', color: '#EF4444' }}>{r.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
            padding: '16px 24px', borderTop: '1px solid #1C2B3F', flexShrink: 0,
          }}>
            {step === 'preview' && (
              <>
                <button onClick={handleClose} className="btn-ghost" style={{ padding: '9px 18px', fontSize: '13px' }}>
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={hasClientErrors || uploading}
                  className="btn-accent"
                  style={{
                    padding: '9px 24px', fontSize: '13px',
                    opacity: hasClientErrors ? 0.5 : 1,
                    cursor: hasClientErrors ? 'not-allowed' : 'pointer',
                  }}
                >
                  Importar {rows.length - clientErrorRows.size} producto{(rows.length - clientErrorRows.size) !== 1 ? 's' : ''}
                </button>
              </>
            )}
            {step === 'done' && (
              <button onClick={handleClose} className="btn-accent" style={{ padding: '9px 24px', fontSize: '13px' }}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
