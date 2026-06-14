'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/admin/productos',
    label: 'Productos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    href: '/admin/ventas',
    label: 'Ventas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    href: '/admin/autos',
    label: 'Autos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6" rx="1"/><path d="M5 9l2-5h10l2 5"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
      </svg>
    ),
  },
  {
    href: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/admin/sucursales',
    label: 'Sucursales',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/admin/cortes',
    label: 'Cortes de Caja',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    href: '/admin/cotizaciones',
    label: 'Cotizaciones',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

interface AdminNavProps {
  user: { nombre: string; apellido: string; rol: string; email: string }
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin-nav-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  function toggle() {
    setCollapsed(prev => {
      localStorage.setItem('admin-nav-collapsed', String(!prev))
      return !prev
    })
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const w = collapsed ? 56 : 232

  return (
    <>
      {/* Mobile top bar */}
      <header className="admin-mobile-header">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '22px', height: '22px', borderRadius: '2px', background: '#FF4400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
              <rect x="7" y="14" width="10" height="6" rx="1"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-syne)', fontSize: '13px', letterSpacing: '0.08em', color: '#F0F0F0' }}>
            A. GUERRERO
          </span>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 49, backdropFilter: 'blur(2px)' }}
        />
      )}

      <aside
        className={`admin-sidebar${mobileOpen ? ' mobile-open' : ''}`}
        style={{
          width: `${w}px`,
          flexShrink: 0,
          background: '#111111',
          borderRight: '1px solid #282828',
          display: 'flex',
          flexDirection: 'column',
          height: '100dvh',
          position: 'sticky',
          top: 0,
          overflow: 'hidden',
          transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
      {/* Top accent stripe */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #FF4400, #FF6633 60%, transparent)', flexShrink: 0 }} />

      {/* Logo + toggle */}
      <div
        style={{
          padding: collapsed ? '16px 0' : '16px 16px',
          borderBottom: '1px solid #282828',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '8px',
          minHeight: '60px',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '2px',
              background: '#FF4400',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                <rect x="7" y="14" width="10" height="6" rx="1"/>
              </svg>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '13px',
                letterSpacing: '0.08em',
                color: '#F0F0F0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              A. GUERRERO
            </span>
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            background: 'none',
            border: 'none',
            color: '#444444',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.12s',
          }}
        >
          {collapsed ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav
        style={{
          padding: collapsed ? '10px 6px' : '12px 10px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflow: 'hidden',
        }}
      >
        {!collapsed && (
          <div style={{
            fontSize: '9px', fontWeight: 700, color: '#444444',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            padding: '4px 8px 8px',
          }}>
            Administración
          </div>
        )}

        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={isActive ? undefined : 'nav-link'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '10px',
                padding: collapsed ? '9px' : '8px 10px',
                borderRadius: '2px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#FF4400' : '#888888',
                background: isActive ? 'rgba(255,68,0,0.10)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                position: 'relative',
                borderLeft: isActive && !collapsed ? '2px solid #FF4400' : '2px solid transparent',
              }}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}

        <div style={{ height: '1px', background: '#282828', margin: '8px 0' }} />

        {!collapsed && (
          <div style={{
            fontSize: '9px', fontWeight: 700, color: '#444444',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            padding: '4px 8px 8px',
          }}>
            Operaciones
          </div>
        )}

        <Link
          href="/caja"
          title={collapsed ? 'Punto de Venta' : undefined}
          className="nav-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px',
            padding: collapsed ? '9px' : '8px 10px',
            borderRadius: '2px',
            fontSize: '13px',
            color: '#888888',
            textDecoration: 'none',
            transition: 'all 0.12s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            borderLeft: '2px solid transparent',
          }}
        >
          <span style={{ flexShrink: 0, opacity: 0.55 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </span>
          {!collapsed && 'Punto de Venta'}
        </Link>
      </nav>

      {/* User */}
      <div
        style={{
          padding: collapsed ? '12px 6px' : '14px 12px',
          borderTop: '1px solid #282828',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              title={`${user.nombre} ${user.apellido} — ${user.rol}`}
              style={{
                width: '32px', height: '32px', borderRadius: '2px',
                background: 'rgba(255,68,0,0.12)',
                border: '1px solid rgba(255,68,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '12px',
                color: '#FF4400', cursor: 'default', letterSpacing: '0.04em',
              }}
            >
              {user.nombre[0]}{user.apellido[0]}
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                background: 'none', border: 'none', color: '#444444',
                cursor: 'pointer', padding: '4px', borderRadius: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.12s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '34px', height: '34px', borderRadius: '2px',
                  background: 'rgba(255,68,0,0.10)',
                  border: '1px solid rgba(255,68,0,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '13px',
                  color: '#FF4400', flexShrink: 0, letterSpacing: '0.04em',
                }}
              >
                {user.nombre[0]}{user.apellido[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.nombre} {user.apellido}
                </div>
                <div style={{ fontSize: '11px', color: '#888888', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <span className="badge badge-accent" style={{ fontSize: '9px', marginBottom: '10px', display: 'block', width: 'fit-content' }}>
              {user.rol}
            </span>
            <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', fontSize: '11px', padding: '7px 10px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
