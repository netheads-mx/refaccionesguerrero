'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export interface Sucursal { id: number; nombre: string }

export interface StockItem { sucursalId: number; stock: number }

export interface ProductoFormData {
  numeroSerie: string
  nombre: string
  descripcion: string
  marca: string
  modelo: string
  color: string
  detalles: string
  anioInicio: string
  anioFin: string
  precioUnitario: string
  inventario: StockItem[]
}

interface MarcaAuto  { id: number; nombre: string }
interface ModeloAuto { id: number; nombre: string }

interface Props {
  sucursales: Sucursal[]
  initial?: ProductoFormData
  editId?: number
}

const EMPTY_INVENTARIO = (sucursales: Sucursal[]): StockItem[] =>
  sucursales.map(s => ({ sucursalId: s.id, stock: 0 }))

const CAR_COLORS = [
  'N/A',
  'Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Azul marino',
  'Verde', 'Amarillo', 'Naranja', 'Café', 'Beige', 'Crema', 'Morado',
  'Dorado', 'Bronce', 'Vino', 'Turquesa',
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function ProductoForm({ sucursales, initial, editId }: Props) {
  const router  = useRouter()
  const isEdit  = editId !== undefined

  const [form, setForm] = useState<ProductoFormData>(
    initial ?? {
      numeroSerie: '', nombre: '', descripcion: '', marca: '',
      modelo: '', color: '', detalles: '', anioInicio: '', anioFin: '', precioUnitario: '',
      inventario: EMPTY_INVENTARIO(sucursales),
    }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // Catalogue data
  const [marcas, setMarcas]               = useState<MarcaAuto[]>([])
  const [modelos, setModelos]             = useState<ModeloAuto[]>([])
  const [loadingMarcas, setLoadingMarcas] = useState(true)
  const [loadingModelos, setLoadingModelos] = useState(false)

  useEffect(() => {
    setLoadingMarcas(true)
    fetch('/api/admin/autos/marcas')
      .then(r => r.json())
      .then((data: MarcaAuto[]) => {
        setMarcas(data)
        if (initial?.marca) {
          const match = data.find(m => m.nombre === initial.marca)
          if (match) loadModelos(match.id)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMarcas(false))
  }, []) // eslint-disable-line

  function loadModelos(marcaId: number) {
    setLoadingModelos(true)
    fetch(`/api/admin/autos/modelos?marcaId=${marcaId}`)
      .then(r => r.json())
      .then((data: ModeloAuto[]) => setModelos(data))
      .catch(() => setModelos([]))
      .finally(() => setLoadingModelos(false))
  }

  function handleMarcaChange(nombre: string) {
    setForm(prev => ({ ...prev, marca: nombre, modelo: '' }))
    setModelos([])
    if (nombre) {
      const match = marcas.find(m => m.nombre === nombre)
      if (match) loadModelos(match.id)
    }
  }

  function set(key: keyof Omit<ProductoFormData, 'inventario'>) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  function setStock(sucursalId: number, value: string) {
    setForm(prev => ({
      ...prev,
      inventario: prev.inventario.map(i =>
        i.sucursalId === sucursalId ? { ...i, stock: Math.max(0, Number(value) || 0) } : i
      ),
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const url    = isEdit ? `/api/admin/productos/${editId}` : '/api/admin/productos'
      const method = isEdit ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Error al guardar'); return }
      router.push('/admin/productos')
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const selStyle     = { cursor: 'pointer' }
  const disSelStyle  = { cursor: 'not-allowed', opacity: 0.5 }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Identificación */}
        <section className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>
            Identificación
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Número de serie" required>
              <input
                required
                className="input-base"
                value={form.numeroSerie}
                onChange={set('numeroSerie')}
                placeholder="ej. CAR-FEND-001"
                readOnly={isEdit}
                style={isEdit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              />
            </Field>
            <Field label="Nombre" required>
              <input required className="input-base" value={form.nombre} onChange={set('nombre')} placeholder="Nombre del producto" />
            </Field>
            <Field label="Descripción">
              <textarea
                className="input-base"
                value={form.descripcion}
                onChange={set('descripcion')}
                placeholder="Descripción breve del producto"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>
        </section>

        {/* Características */}
        <section className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>
            Características
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Marca">
              <select
                className="input-base"
                value={form.marca}
                onChange={e => handleMarcaChange(e.target.value)}
                disabled={loadingMarcas}
                style={loadingMarcas ? disSelStyle : selStyle}
              >
                <option value="">{loadingMarcas ? 'Cargando…' : 'Seleccionar marca…'}</option>
                {form.marca && !marcas.some(m => m.nombre === form.marca) && (
                  <option value={form.marca}>{form.marca}</option>
                )}
                {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
              </select>
            </Field>
            <Field label="Modelo">
              <select
                className="input-base"
                value={form.modelo}
                onChange={set('modelo')}
                disabled={!form.marca || loadingModelos}
                style={!form.marca || loadingModelos ? disSelStyle : selStyle}
              >
                <option value="">
                  {!form.marca ? 'Selecciona una marca primero'
                    : loadingModelos ? 'Cargando…'
                    : modelos.length === 0 ? 'Sin modelos registrados'
                    : 'Seleccionar modelo…'}
                </option>
                {form.modelo && !modelos.some(m => m.nombre === form.modelo) && (
                  <option value={form.modelo}>{form.modelo}</option>
                )}
                {modelos.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
              </select>
            </Field>
            <Field label="Color">
              <select className="input-base" value={form.color} onChange={set('color')} style={selStyle}>
                <option value="">Seleccionar color…</option>
                {form.color && !CAR_COLORS.includes(form.color) && (
                  <option value={form.color}>{form.color}</option>
                )}
                {CAR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Año desde">
              <input
                type="number"
                min="1950"
                max="2099"
                className="input-base"
                value={form.anioInicio}
                onChange={set('anioInicio')}
                placeholder="ej. 2015"
              />
            </Field>
            <Field label="Año hasta">
              <input
                type="number"
                min="1950"
                max="2099"
                className="input-base"
                value={form.anioFin}
                onChange={set('anioFin')}
                placeholder="ej. 2023"
              />
            </Field>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Field label="Detalles adicionales">
              <textarea
                className="input-base"
                value={form.detalles}
                onChange={set('detalles')}
                placeholder="Especificaciones técnicas, compatibilidad, notas…"
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Precio */}
        <section className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>
            Precio
          </h2>
          <Field label="Precio unitario (MXN)" required>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className="input-base"
              value={form.precioUnitario}
              onChange={set('precioUnitario')}
              placeholder="0.00"
            />
          </Field>
        </section>

        {/* Inventario por sucursal */}
        <section className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px', color: '#8896B3', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' }}>
            Stock por sucursal
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sucursales.map(s => {
              const item = form.inventario.find(i => i.sucursalId === s.id)
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ flex: 1, fontSize: '13px', color: '#E8EDFF', fontWeight: 500 }}>
                    {s.nombre}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min="0"
                      className="input-base"
                      style={{ width: '100px', textAlign: 'right' }}
                      value={item?.stock ?? 0}
                      onChange={e => setStock(s.id, e.target.value)}
                    />
                    <span style={{ fontSize: '12px', color: '#8896B3', width: '36px' }}>
                      {(item?.stock ?? 0) === 1 ? 'unidad' : 'uds.'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Total */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1C2B3F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8896B3' }}>Total en inventario</span>
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '18px', color: '#F59E0B' }}>
              {form.inventario.reduce((s, i) => s + (i.stock || 0), 0)}
            </span>
          </div>
        </section>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '13px', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" className="btn-accent" disabled={saving} style={{ padding: '11px 28px' }}>
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <Link href="/admin/productos" className="btn-ghost" style={{ padding: '11px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
