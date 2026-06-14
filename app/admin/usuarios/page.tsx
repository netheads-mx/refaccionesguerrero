'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Sucursal { id: number; nombre: string }

interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  rol: 'administrador' | 'manager' | 'cajero'
  activo: boolean
  creadoEn: string
  sucursal: { id: number; nombre: string } | null
}

const LIMITS = [10, 20, 50, 100]
const ROL_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  manager: 'Manager',
  cajero: 'Cajero',
}
const ROL_COLORS: Record<string, string> = {
  administrador: '#F59E0B',
  manager: '#3B82F6',
  cajero: '#22C55E',
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const emptyForm = {
  nombre: '', apellido: '', email: '', password: '',
  rol: 'cajero' as Usuario['rol'], sucursalId: '',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios]     = useState<Usuario[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [limit, setLimit]           = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])

  // Filters
  const [q, setQ]                   = useState('')
  const [activoFilter, setActivoFilter] = useState('true')
  const debouncedQ = useRef(q)

  // Modal
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState<Usuario | null>(null)
  const [form, setForm]             = useState({ ...emptyForm })
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  // Delete confirm
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [deleting, setDeleting]     = useState(false)

  const fetchRef = useRef(0)

  const load = useCallback(async (p = page) => {
    const id = ++fetchRef.current
    setLoading(true)
    const params = new URLSearchParams({
      page: String(p), limit: String(limit), q: debouncedQ.current,
      ...(activoFilter ? { activo: activoFilter } : {}),
    })
    const res = await fetch(`/api/admin/usuarios?${params}`)
    if (!res.ok || fetchRef.current !== id) return
    const json = await res.json()
    setUsuarios(json.data)
    setTotal(json.total)
    setTotalPages(json.totalPages)
    setPage(p)
    setLoading(false)
  }, [page, limit, activoFilter])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      debouncedQ.current = q
      load(1)
    }, 350)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line

  useEffect(() => { load(1) }, [limit, activoFilter]) // eslint-disable-line
  useEffect(() => { load(page) }, [page]) // eslint-disable-line

  useEffect(() => {
    fetch('/api/admin/sucursales').then(r => r.json()).then(setSucursales).catch(() => {})
  }, [])

  function openCreate() {
    setEditTarget(null)
    setForm({ ...emptyForm })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(u: Usuario) {
    setEditTarget(u)
    setForm({
      nombre: u.nombre, apellido: u.apellido, email: u.email,
      password: '', rol: u.rol, sucursalId: u.sucursal ? String(u.sucursal.id) : '',
    })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    setFormError('')
    const url    = editTarget ? `/api/admin/usuarios/${editTarget.id}` : '/api/admin/usuarios'
    const method = editTarget ? 'PATCH' : 'POST'
    const body: Record<string, unknown> = { ...form }
    if (editTarget && !form.password) delete body.password

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setFormError(json.error ?? 'Error al guardar'); setSaving(false); return }
    setSaving(false)
    setShowModal(false)
    load(editTarget ? page : 1)
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleting(true)
    await fetch(`/api/admin/usuarios/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    load(page)
  }

  // Pagination
  function pages() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | '…')[] = [1]
    if (page > 3) arr.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i)
    if (page < totalPages - 2) arr.push('…')
    arr.push(totalPages)
    return arr
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({
      ...prev,
      [k]: e.target.value,
      ...(k === 'rol' && e.target.value === 'administrador' ? { sucursalId: '' } : {}),
    }))

  return (
    <div style={{ padding: '32px', maxWidth: '1300px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '26px', color: '#E8EDFF', margin: 0 }}>
            Usuarios
          </h1>
          <p style={{ color: '#8896B3', fontSize: '14px', margin: '4px 0 0' }}>
            {total.toLocaleString()} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-accent" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8896B3' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input-base"
            style={{ paddingLeft: '32px', width: '100%' }}
            placeholder="Buscar por nombre, apellido o email…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        <select
          className="input-base"
          style={{ width: '140px' }}
          value={activoFilter}
          onChange={e => { setActivoFilter(e.target.value); setPage(1) }}
        >
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="">Todos</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          {LIMITS.map(l => (
            <button
              key={l}
              onClick={() => { setLimit(l); setPage(1) }}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: '1px solid',
                fontSize: '13px', cursor: 'pointer',
                background: limit === l ? 'rgba(245,158,11,0.15)' : 'transparent',
                borderColor: limit === l ? '#F59E0B' : '#1C2B3F',
                color: limit === l ? '#F59E0B' : '#8896B3',
                fontWeight: limit === l ? 600 : 400, transition: 'all 0.15s',
              }}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>Cargando…</div>
        ) : usuarios.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#8896B3' }}>
            No se encontraron usuarios.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1C2B3F' }}>
                {['Usuario', 'Email', 'Rol', 'Sucursal', 'Alta', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                deleteId === u.id ? (
                  <tr key={u.id} style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid #1C2B3F' }}>
                    <td colSpan={7} style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#E8EDFF' }}>
                          ¿Desactivar a <strong>{u.nombre} {u.apellido}</strong>?
                        </span>
                        <button
                          className="btn-danger"
                          style={{ padding: '5px 14px', fontSize: '13px' }}
                          onClick={handleDelete}
                          disabled={deleting}
                        >
                          {deleting ? 'Procesando…' : 'Sí, desactivar'}
                        </button>
                        <button className="btn-ghost" style={{ padding: '5px 14px', fontSize: '13px' }} onClick={() => setDeleteId(null)}>
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="table-row" style={{ borderBottom: '1px solid #1C2B3F' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: `${ROL_COLORS[u.rol]}18`,
                          border: `1px solid ${ROL_COLORS[u.rol]}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '12px',
                          color: ROL_COLORS[u.rol], flexShrink: 0,
                        }}>
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#E8EDFF' }}>{u.nombre} {u.apellido}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>{u.email}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                        fontSize: '11px', fontWeight: 600,
                        background: `${ROL_COLORS[u.rol]}18`,
                        color: ROL_COLORS[u.rol],
                        border: `1px solid ${ROL_COLORS[u.rol]}40`,
                      }}>
                        {ROL_LABELS[u.rol] ?? u.rol}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '13px', color: '#8896B3' }}>
                      {u.sucursal ? u.sucursal.nombre : <span style={{ color: '#F59E0B', fontStyle: 'italic' }}>Todas las sucursales</span>}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#8896B3' }}>{fmtDate(u.creadoEn)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span className={u.activo ? 'badge badge-success' : 'badge badge-muted'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => openEdit(u)}
                        >Editar</button>
                        {u.activo && (
                          <button
                            className="btn-danger"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => setDeleteId(u.id)}
                          >Desactivar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
          <span style={{ fontSize: '13px', color: '#8896B3' }}>
            {total.toLocaleString()} usuario{total !== 1 ? 's' : ''}
          </span>
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

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px', position: 'relative' }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#8896B3', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
            >×</button>

            <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '18px', color: '#E8EDFF', margin: '0 0 20px' }}>
              {editTarget ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>

            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre *</label>
                <input className="input-base" value={form.nombre} onChange={f('nombre')} placeholder="Juan" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Apellido *</label>
                <input className="input-base" value={form.apellido} onChange={f('apellido')} placeholder="Pérez" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email *</label>
              <input className="input-base" type="email" value={form.email} onChange={f('email')} placeholder="juan@empresa.com" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
              <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {editTarget ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </label>
              <input className="input-base" type="password" value={form.password} onChange={f('password')} placeholder={editTarget ? '••••••••' : 'Mínimo 6 caracteres'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rol *</label>
                <select className="input-base" value={form.rol} onChange={f('rol')}>
                  <option value="cajero">Cajero</option>
                  <option value="manager">Manager</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Sucursal {form.rol !== 'administrador' && '*'}
                </label>
                {form.rol === 'administrador' ? (
                  <div className="input-base" style={{ color: '#F59E0B', fontStyle: 'italic', cursor: 'default' }}>
                    Todas las sucursales
                  </div>
                ) : (
                  <select className="input-base" value={form.sucursalId} onChange={f('sucursalId')}>
                    <option value="">Seleccionar…</option>
                    {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando…' : editTarget ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
