'use client'

import { useState, useEffect, FormEvent } from 'react'

interface Sucursal {
  id: number
  nombre: string
  direccion: string
  creadoEn: string
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const emptyForm = { nombre: '', direccion: '' }

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Modal
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<Sucursal | null>(null)
  const [form, setForm]             = useState({ ...emptyForm })
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Sucursal | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [deleteError, setDeleteError]   = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/sucursales')
    if (!res.ok) { setError('Error al cargar sucursales'); setLoading(false); return }
    setSucursales(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(s: Sucursal) {
    setEditTarget(s)
    setForm({ nombre: s.nombre, direccion: s.direccion })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const url    = editTarget ? `/api/admin/sucursales/${editTarget.id}` : '/api/admin/sucursales'
    const method = editTarget ? 'PATCH' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setFormError(json.error ?? 'Error al guardar'); setSaving(false); return }
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    const res  = await fetch(`/api/admin/sucursales/${deleteTarget.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) { setDeleteError(json.error ?? 'Error al eliminar'); setDeleting(false); return }
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  const f = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  return (
    <div style={{ padding: '36px 40px', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
            Sucursales
          </h1>
          <p style={{ fontSize: '13px', color: '#8896B3', marginTop: '4px' }}>
            {sucursales.length} sucursal{sucursales.length !== 1 ? 'es' : ''} registrada{sucursales.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-accent" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva sucursal
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          {error}
          <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '12px', textDecoration: 'underline' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>Cargando…</div>
        ) : sucursales.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>
            No hay sucursales registradas.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2B3F', background: '#0B1121' }}>
                {['Nombre', 'Dirección', 'Alta', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sucursales.map(s => (
                <React.Fragment key={s.id}>
                  <tr className="table-row" style={{ borderBottom: deleteTarget?.id === s.id ? 'none' : '1px solid #1C2B3F' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'rgba(245,158,11,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#F59E0B', flexShrink: 0,
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#E8EDFF' }}>{s.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#8896B3' }}>{s.direccion}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#8896B3' }}>{fmtDate(s.creadoEn)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                          onClick={() => openEdit(s)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-danger"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                          onClick={() => { setDeleteTarget(s); setDeleteError('') }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline delete confirmation */}
                  {deleteTarget?.id === s.id && (
                    <tr style={{ background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid #1C2B3F' }}>
                      <td colSpan={4} style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#EF4444' }}>
                            ¿Eliminar <strong>"{s.nombre}"</strong>? Esta acción no se puede deshacer.
                          </span>
                          {deleteError && (
                            <span style={{ fontSize: '12px', color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                              {deleteError}
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn-danger"
                              style={{ padding: '5px 14px', fontSize: '13px' }}
                              onClick={handleDelete}
                              disabled={deleting}
                            >
                              {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                            </button>
                            <button
                              className="btn-ghost"
                              style={{ padding: '5px 14px', fontSize: '13px' }}
                              onClick={() => { setDeleteTarget(null); setDeleteError('') }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#8896B3', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
            >×</button>

            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '18px', color: '#E8EDFF', margin: '0 0 20px' }}>
              {editTarget ? 'Editar sucursal' : 'Nueva sucursal'}
            </h2>

            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Nombre <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  required
                  className="input-base"
                  value={form.nombre}
                  onChange={f('nombre')}
                  placeholder="ej. Sucursal Centro"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Dirección <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  required
                  className="input-base"
                  value={form.direccion}
                  onChange={f('direccion')}
                  placeholder="ej. Av. Insurgentes 123, CDMX"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-accent" disabled={saving}>
                  {saving ? 'Guardando…' : editTarget ? 'Guardar cambios' : 'Crear sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// React needed for React.Fragment
import React from 'react'
