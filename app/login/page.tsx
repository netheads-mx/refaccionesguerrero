'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      router.push(data.rol === 'cajero' ? '/caja' : '/admin')
    } catch {
      setError('No se pudo conectar al servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: '#0A0A0A', position: 'relative', overflow: 'hidden' }}>

      {/* Grain texture */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 900,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.028,
        }}
      />

      {/* Top accent stripe */}
      <div aria-hidden style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 200,
        background: 'linear-gradient(90deg, #FF4400 0%, #FF6633 60%, transparent 100%)',
      }} />

      {/* ── Left panel ── */}
      <div
        className="hidden md:flex"
        style={{
          flex: '0 0 480px',
          background: '#111111',
          borderRight: '1px solid #282828',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid texture */}
        <div className="bg-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />

        {/* Accent glow */}
        <div aria-hidden style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(255,68,0,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Top — Logo */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '2px',
              background: '#FF4400',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                <rect x="7" y="14" width="10" height="6" rx="1"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-syne)', fontSize: '18px',
              letterSpacing: '0.1em', color: '#F0F0F0',
            }}>
              AUTOPARTES GUERRERO
            </span>
          </div>
          <div style={{ marginTop: '24px', width: '48px', height: '2px', background: '#FF4400' }} />
        </div>

        {/* Middle — Hero copy */}
        <div style={{ position: 'relative' }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, color: '#FF4400',
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            Sistema de Gestión
          </p>
          <h2 style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '56px', lineHeight: 0.9,
            color: '#F0F0F0', marginBottom: '24px',
            letterSpacing: '0.04em',
          }}>
            GESTIÓN<br />
            <span style={{ color: '#FF4400' }}>INDUSTRIAL</span><br />
            DE STOCK
          </h2>
          <p style={{ fontSize: '14px', color: '#888888', lineHeight: 1.75, marginBottom: '40px', maxWidth: '320px' }}>
            Controla tu inventario, procesa ventas y administra sucursales desde un solo lugar.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #282828' }}>
            {[
              { label: 'Inventario en tiempo real' },
              { label: 'Punto de venta rápido' },
              { label: 'Control multi-sucursal' },
              { label: 'Corte de caja diario' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #282828' : 'none',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '0',
                  background: '#FF4400', flexShrink: 0,
                }} />
                <span style={{ fontSize: '13px', color: '#888888' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '11px', color: '#444444', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} AUTOPARTES GUERRERO
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div className="animate-fade-up" style={{ width: '100%', maxWidth: '400px' }}>

          {/* Mobile logo */}
          <div className="md:hidden" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '2px',
              background: '#FF4400',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                <rect x="7" y="14" width="10" height="6" rx="1"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-syne)', fontSize: '16px', letterSpacing: '0.1em', color: '#F0F0F0' }}>
              AUTOPARTES GUERRERO
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '28px', height: '1px', background: '#FF4400' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF4400' }}>
                Acceso al Sistema
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-syne)',
              fontSize: '40px', lineHeight: 0.95, color: '#F0F0F0',
              letterSpacing: '0.04em', marginBottom: '10px',
            }}>
              BIENVENIDO
            </h1>
            <p style={{ fontSize: '13px', color: '#888888' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="input-label">Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#444444', pointerEvents: 'none' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-base"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="input-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#444444', pointerEvents: 'none' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-base"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '42px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444444', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '11px 14px',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderLeft: '2px solid #DC2626',
                borderRadius: '2px',
                fontSize: '13px', color: '#DC2626',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-accent"
              disabled={loading}
              style={{ width: '100%', marginTop: '4px', padding: '13px', fontSize: '13px' }}
            >
              {loading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Roles info */}
          <div style={{
            marginTop: '32px',
            border: '1px solid #282828', borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #282828',
              background: '#111111',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Roles de acceso
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { badge: 'Admin',   cls: 'badge-accent',  desc: 'Panel completo de gestión' },
                { badge: 'Manager', cls: 'badge-indigo',  desc: 'Reportes y productos' },
                { badge: 'Cajero',  cls: 'badge-success', desc: 'Punto de venta' },
              ].map((r, i, arr) => (
                <div key={r.badge} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid #282828' : 'none',
                }}>
                  <span className={`badge ${r.cls}`} style={{ minWidth: '60px', justifyContent: 'center' }}>{r.badge}</span>
                  <span style={{ fontSize: '12px', color: '#888888' }}>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hidden { display: none; }
        @media (min-width: 768px) { .hidden.md\\:flex { display: flex !important; } .md\\:hidden { display: none !important; } }
      `}</style>
    </div>
  )
}
