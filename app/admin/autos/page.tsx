'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Marca {
  id: number
  nombre: string
  pais: string | null
  _count: { modelos: number }
}

interface Modelo {
  id: number
  nombre: string
  marcaId: number
  _count: { versiones: number }
}

interface Version {
  id: number
  nombre: string
  modeloId: number
  anioInicio: number
  anioFin: number | null
  motor: string | null
  transmision: string | null
}

type ModalMode = 'create' | 'edit'
type ModalType = 'marca' | 'modelo' | 'version'

// ─── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)
const CarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="6" rx="1" /><path d="M5 9l2-5h10l2 5" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" />
  </svg>
)

// ─── Small reusables ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: '#374151', fontSize: '13px' }}>
      {text}
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px', color: '#EF4444', marginTop: '8px' }}>
      {msg}
    </div>
  )
}

// ─── Column Panel ─────────────────────────────────────────────────────────────

function ColumnHeader({
  title, subtitle, onAdd, loading,
}: {
  title: string; subtitle?: string; onAdd: () => void; loading?: boolean
}) {
  return (
    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1C2B3F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#E8EDFF' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      <button onClick={onAdd} className="btn-accent" style={{ padding: '6px 12px', fontSize: '12px', gap: '5px' }} disabled={loading}>
        <PlusIcon />
        Agregar
      </button>
    </div>
  )
}

// ─── Delete confirmation inline ───────────────────────────────────────────────

function DeleteConfirm({ label, onConfirm, onCancel, loading }: {
  label: string; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <div style={{ padding: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', marginTop: '4px' }}>
      <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '10px' }}>
        ¿Eliminar <strong>{label}</strong>? Esta acción no se puede deshacer.
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onConfirm} disabled={loading} className="btn-danger" style={{ fontSize: '12px' }}>
          {loading ? <Spinner /> : <TrashIcon />}
          Eliminar
        </button>
        <button onClick={onCancel} className="btn-ghost" style={{ fontSize: '12px', padding: '5px 10px' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,18,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card animate-fade-up" style={{ width: '100%', maxWidth: '460px', padding: '28px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '18px', color: '#E8EDFF', marginBottom: '20px' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutosPage() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [versiones, setVersiones] = useState<Version[]>([])

  const [selectedMarcaId, setSelectedMarcaId] = useState<number | null>(null)
  const [selectedModeloId, setSelectedModeloId] = useState<number | null>(null)

  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [loadingModelos, setLoadingModelos] = useState(false)
  const [loadingVersiones, setLoadingVersiones] = useState(false)

  const [fetchError, setFetchError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: ModalType; id: number; label: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Modal state
  const [modal, setModal] = useState<{ type: ModalType; mode: ModalMode; data?: Marca | Modelo | Version } | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Form fields
  const [fNombre, setFNombre] = useState('')
  const [fPais, setFPais] = useState('')
  const [fAnioInicio, setFAnioInicio] = useState('')
  const [fAnioFin, setFAnioFin] = useState('')
  const [fMotor, setFMotor] = useState('')
  const [fTransmision, setFTransmision] = useState('')

  // ── Fetchers ──

  async function safeJson<T>(res: Response, fallback: T): Promise<T> {
    const text = await res.text()
    if (!text) return fallback
    try {
      return JSON.parse(text) as T
    } catch {
      console.error('JSON parse error, body was:', text.slice(0, 200))
      return fallback
    }
  }

  const fetchMarcas = useCallback(async () => {
    setLoadingMarcas(true)
    setFetchError('')
    try {
      const res = await fetch('/api/admin/autos/marcas')
      const data = await safeJson<Marca[] | { error: string }>(res, [])
      if (!res.ok) {
        setFetchError((data as { error: string }).error ?? 'Error al cargar marcas')
        setMarcas([])
      } else {
        setMarcas(data as Marca[])
      }
    } catch (e) {
      setFetchError('No se pudo conectar con el servidor')
      setMarcas([])
    } finally {
      setLoadingMarcas(false)
    }
  }, [])

  const fetchModelos = useCallback(async (marcaId: number) => {
    setLoadingModelos(true)
    setModelos([])
    setVersiones([])
    setSelectedModeloId(null)
    try {
      const res = await fetch(`/api/admin/autos/modelos?marcaId=${marcaId}`)
      const data = await safeJson<Modelo[]>(res, [])
      setModelos(Array.isArray(data) ? data : [])
    } catch {
      setModelos([])
    } finally {
      setLoadingModelos(false)
    }
  }, [])

  const fetchVersiones = useCallback(async (modeloId: number) => {
    setLoadingVersiones(true)
    setVersiones([])
    try {
      const res = await fetch(`/api/admin/autos/versiones?modeloId=${modeloId}`)
      const data = await safeJson<Version[]>(res, [])
      setVersiones(Array.isArray(data) ? data : [])
    } catch {
      setVersiones([])
    } finally {
      setLoadingVersiones(false)
    }
  }, [])

  useEffect(() => { fetchMarcas() }, [fetchMarcas])

  // ── Open modal helpers ──

  function openCreate(type: ModalType) {
    setFNombre(''); setFPais(''); setFAnioInicio(''); setFAnioFin(''); setFMotor(''); setFTransmision('')
    setFormError('')
    setModal({ type, mode: 'create' })
  }

  function openEdit(type: ModalType, data: Marca | Modelo | Version) {
    setFormError('')
    setFNombre(data.nombre)
    if (type === 'marca') { setFPais((data as Marca).pais ?? '') }
    if (type === 'version') {
      const v = data as Version
      setFAnioInicio(String(v.anioInicio))
      setFAnioFin(v.anioFin ? String(v.anioFin) : '')
      setFMotor(v.motor ?? '')
      setFTransmision(v.transmision ?? '')
    }
    setModal({ type, mode: 'edit', data })
  }

  // ── Submit ──

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    const { type, mode, data } = modal!

    try {
      let url = ''
      let body: Record<string, unknown> = {}
      let method = mode === 'create' ? 'POST' : 'PATCH'

      if (type === 'marca') {
        url = mode === 'create' ? '/api/admin/autos/marcas' : `/api/admin/autos/marcas/${(data as Marca).id}`
        body = { nombre: fNombre, pais: fPais }
      } else if (type === 'modelo') {
        url = mode === 'create' ? '/api/admin/autos/modelos' : `/api/admin/autos/modelos/${(data as Modelo).id}`
        body = { nombre: fNombre, marcaId: selectedMarcaId }
      } else {
        url = mode === 'create' ? '/api/admin/autos/versiones' : `/api/admin/autos/versiones/${(data as Version).id}`
        body = { nombre: fNombre, modeloId: selectedModeloId, anioInicio: fAnioInicio, anioFin: fAnioFin || null, motor: fMotor, transmision: fTransmision }
      }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await safeJson<{ error?: string }>(res, {})
      if (!res.ok) { setFormError(result.error || 'Error desconocido'); return }

      setModal(null)
      if (type === 'marca') await fetchMarcas()
      if (type === 'modelo' && selectedMarcaId) await fetchModelos(selectedMarcaId)
      if (type === 'version' && selectedModeloId) await fetchVersiones(selectedModeloId)
    } catch {
      setFormError('Error de conexión')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Delete ──

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleteLoading(true)
    const { type, id } = confirmDelete

    const urls: Record<ModalType, string> = {
      marca: `/api/admin/autos/marcas/${id}`,
      modelo: `/api/admin/autos/modelos/${id}`,
      version: `/api/admin/autos/versiones/${id}`,
    }

    await fetch(urls[type], { method: 'DELETE' })
    setConfirmDelete(null)
    setDeleteLoading(false)

    if (type === 'marca') {
      if (selectedMarcaId === id) { setSelectedMarcaId(null); setModelos([]); setVersiones([]) }
      await fetchMarcas()
    }
    if (type === 'modelo') {
      if (selectedModeloId === id) { setSelectedModeloId(null); setVersiones([]) }
      if (selectedMarcaId) await fetchModelos(selectedMarcaId)
    }
    if (type === 'version' && selectedModeloId) await fetchVersiones(selectedModeloId)
  }

  // ── Marca selection ──
  function selectMarca(id: number) {
    if (selectedMarcaId === id) return
    setSelectedMarcaId(id)
    setSelectedModeloId(null)
    setVersiones([])
    fetchModelos(id)
  }

  function selectModelo(id: number) {
    if (selectedModeloId === id) return
    setSelectedModeloId(id)
    fetchVersiones(id)
  }

  const selectedMarca = marcas.find((m) => m.id === selectedMarcaId)
  const selectedModelo = modelos.find((m) => m.id === selectedModeloId)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '36px 40px', height: '100%' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
            <CarIcon />
          </div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF' }}>
            Catálogo de Autos
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#8896B3', marginLeft: '48px' }}>
          Gestiona marcas, modelos y versiones. Selecciona una fila para navegar en la jerarquía.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="animate-fade-up delay-100" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '20px' }}>
        <span style={{ color: selectedMarca ? '#8896B3' : '#E8EDFF' }}>Marcas</span>
        {selectedMarca && (
          <>
            <ChevronIcon />
            <span style={{ color: selectedModelo ? '#8896B3' : '#E8EDFF' }}>{selectedMarca.nombre}</span>
          </>
        )}
        {selectedModelo && (
          <>
            <ChevronIcon />
            <span style={{ color: '#E8EDFF' }}>{selectedModelo.nombre}</span>
          </>
        )}
      </div>

      {/* API error banner */}
      {fetchError && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {fetchError}
          <button onClick={fetchMarcas} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px', textDecoration: 'underline' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* 3-column layout */}
      <div
        className="animate-fade-up delay-200"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'start' }}
      >
        {/* ── Column 1: Marcas ── */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <ColumnHeader
            title="Marcas"
            subtitle={`${marcas.length} en total`}
            onAdd={() => openCreate('marca')}
          />
          <div style={{ maxHeight: '520px', overflow: 'auto' }}>
            {loadingMarcas ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', color: '#374151' }}><Spinner /></div>
            ) : marcas.length === 0 ? (
              <EmptyState text="Sin marcas. Agrega la primera." />
            ) : (
              marcas.map((marca) => (
                <div key={marca.id}>
                  <div
                    onClick={() => selectMarca(marca.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #1C2B3F',
                      background: selectedMarcaId === marca.id ? 'rgba(245,158,11,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                      borderLeft: selectedMarcaId === marca.id ? '2px solid #F59E0B' : '2px solid transparent',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: selectedMarcaId === marca.id ? '#F59E0B' : '#E8EDFF' }}>
                        {marca.nombre}
                      </div>
                      <div style={{ fontSize: '11px', color: '#374151', marginTop: '1px' }}>
                        {marca.pais ?? '—'} · {marca._count.modelos} modelo{marca._count.modelos !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit('marca', marca) }}
                        title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'marca', id: marca.id, label: marca.nombre }) }}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                      >
                        <TrashIcon />
                      </button>
                      <span style={{ color: '#374151' }}><ChevronIcon /></span>
                    </div>
                  </div>
                  {confirmDelete?.type === 'marca' && confirmDelete.id === marca.id && (
                    <div style={{ padding: '0 14px 12px' }}>
                      <DeleteConfirm
                        label={marca.nombre}
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmDelete(null)}
                        loading={deleteLoading}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Column 2: Modelos ── */}
        <div className="card" style={{ overflow: 'hidden', opacity: selectedMarcaId ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <ColumnHeader
            title={selectedMarca ? `Modelos — ${selectedMarca.nombre}` : 'Modelos'}
            subtitle={selectedMarca ? `${modelos.length} modelo${modelos.length !== 1 ? 's' : ''}` : 'Selecciona una marca'}
            onAdd={() => openCreate('modelo')}
            loading={!selectedMarcaId}
          />
          <div style={{ maxHeight: '520px', overflow: 'auto' }}>
            {!selectedMarcaId ? (
              <EmptyState text="← Selecciona una marca" />
            ) : loadingModelos ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', color: '#374151' }}><Spinner /></div>
            ) : modelos.length === 0 ? (
              <EmptyState text="Sin modelos. Agrega el primero." />
            ) : (
              modelos.map((modelo) => (
                <div key={modelo.id}>
                  <div
                    onClick={() => selectModelo(modelo.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #1C2B3F',
                      background: selectedModeloId === modelo.id ? 'rgba(245,158,11,0.06)' : 'transparent',
                      transition: 'background 0.15s',
                      borderLeft: selectedModeloId === modelo.id ? '2px solid #F59E0B' : '2px solid transparent',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: selectedModeloId === modelo.id ? '#F59E0B' : '#E8EDFF' }}>
                        {modelo.nombre}
                      </div>
                      <div style={{ fontSize: '11px', color: '#374151', marginTop: '1px' }}>
                        {modelo._count.versiones} versión{modelo._count.versiones !== 1 ? 'es' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit('modelo', modelo) }}
                        title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'modelo', id: modelo.id, label: modelo.nombre }) }}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                      >
                        <TrashIcon />
                      </button>
                      <span style={{ color: '#374151' }}><ChevronIcon /></span>
                    </div>
                  </div>
                  {confirmDelete?.type === 'modelo' && confirmDelete.id === modelo.id && (
                    <div style={{ padding: '0 14px 12px' }}>
                      <DeleteConfirm
                        label={modelo.nombre}
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmDelete(null)}
                        loading={deleteLoading}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Column 3: Versiones ── */}
        <div className="card" style={{ overflow: 'hidden', opacity: selectedModeloId ? 1 : 0.4, transition: 'opacity 0.2s' }}>
          <ColumnHeader
            title={selectedModelo ? `Versiones — ${selectedModelo.nombre}` : 'Versiones'}
            subtitle={selectedModelo ? `${versiones.length} versión${versiones.length !== 1 ? 'es' : ''}` : 'Selecciona un modelo'}
            onAdd={() => openCreate('version')}
            loading={!selectedModeloId}
          />
          <div style={{ maxHeight: '520px', overflow: 'auto' }}>
            {!selectedModeloId ? (
              <EmptyState text="← Selecciona un modelo" />
            ) : loadingVersiones ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px', color: '#374151' }}><Spinner /></div>
            ) : versiones.length === 0 ? (
              <EmptyState text="Sin versiones. Agrega la primera." />
            ) : (
              versiones.map((v) => (
                <div key={v.id}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      padding: '12px 14px', borderBottom: '1px solid #1C2B3F',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF', marginBottom: '4px' }}>
                        {v.nombre}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span className="badge badge-accent" style={{ fontSize: '10px' }}>
                          {v.anioInicio}{v.anioFin ? `–${v.anioFin}` : '+'}
                        </span>
                        {v.motor && <span className="badge badge-muted" style={{ fontSize: '10px' }}>{v.motor}</span>}
                        {v.transmision && <span className="badge badge-muted" style={{ fontSize: '10px' }}>{v.transmision}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                      <button
                        onClick={() => openEdit('version', v)}
                        title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#F59E0B')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'version', id: v.id, label: v.nombre })}
                        title="Eliminar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896B3', padding: '4px', borderRadius: '4px', display: 'flex' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#8896B3')}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  {confirmDelete?.type === 'version' && confirmDelete.id === v.id && (
                    <div style={{ padding: '0 14px 12px' }}>
                      <DeleteConfirm
                        label={v.nombre}
                        onConfirm={handleDelete}
                        onCancel={() => setConfirmDelete(null)}
                        loading={deleteLoading}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <Modal
          title={
            modal.mode === 'create'
              ? { marca: 'Nueva Marca', modelo: 'Nuevo Modelo', version: 'Nueva Versión' }[modal.type]
              : { marca: 'Editar Marca', modelo: 'Editar Modelo', version: 'Editar Versión' }[modal.type]
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Context label */}
            {modal.type === 'modelo' && selectedMarca && (
              <div style={{ padding: '8px 12px', background: '#111827', border: '1px solid #1C2B3F', borderRadius: '6px', fontSize: '12px', color: '#8896B3' }}>
                Marca: <strong style={{ color: '#F59E0B' }}>{selectedMarca.nombre}</strong>
              </div>
            )}
            {modal.type === 'version' && selectedMarca && selectedModelo && (
              <div style={{ padding: '8px 12px', background: '#111827', border: '1px solid #1C2B3F', borderRadius: '6px', fontSize: '12px', color: '#8896B3' }}>
                {selectedMarca.nombre} › <strong style={{ color: '#F59E0B' }}>{selectedModelo.nombre}</strong>
              </div>
            )}

            <Field label="Nombre *">
              <input required className="input-base" value={fNombre} onChange={(e) => setFNombre(e.target.value)}
                placeholder={modal.type === 'marca' ? 'ej. Toyota' : modal.type === 'modelo' ? 'ej. Corolla' : 'ej. LE Sport'} />
            </Field>

            {modal.type === 'marca' && (
              <Field label="País de origen">
                <input className="input-base" value={fPais} onChange={(e) => setFPais(e.target.value)} placeholder="ej. Japón" />
              </Field>
            )}

            {modal.type === 'version' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Field label="Año inicio *">
                    <input required type="number" min="1950" max="2099" className="input-base" value={fAnioInicio}
                      onChange={(e) => setFAnioInicio(e.target.value)} placeholder="2019" />
                  </Field>
                  <Field label="Año fin">
                    <input type="number" min="1950" max="2099" className="input-base" value={fAnioFin}
                      onChange={(e) => setFAnioFin(e.target.value)} placeholder="2023 (vacío = actual)" />
                  </Field>
                </div>
                <Field label="Motor">
                  <input className="input-base" value={fMotor} onChange={(e) => setFMotor(e.target.value)} placeholder="ej. 2.0L 4cil 152hp" />
                </Field>
                <Field label="Transmisión">
                  <input className="input-base" value={fTransmision} onChange={(e) => setFTransmision(e.target.value)} placeholder="ej. CVT / Manual 6v / Automático 8v" />
                </Field>
              </>
            )}

            {formError && <ErrorMsg msg={formError} />}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="submit" className="btn-accent" disabled={formLoading} style={{ flex: 1, padding: '12px' }}>
                {formLoading ? <><Spinner /> Guardando...</> : modal.mode === 'create' ? 'Crear' : 'Guardar cambios'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setModal(null)} style={{ padding: '12px 16px' }}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
