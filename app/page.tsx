import Link from 'next/link'

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Búsqueda Instantánea',
    desc: 'Localiza cualquier producto por nombre, serie, marca o modelo en milisegundos.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    title: 'Punto de Venta',
    desc: 'Agrega productos al carrito, aplica IVA y cobra con efectivo o transferencia.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
      </svg>
    ),
    title: 'Gestión de Inventario',
    desc: 'Control de stock en tiempo real por sucursal. Las ventas actualizan el inventario automáticamente.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Control de Acceso',
    desc: 'Roles diferenciados: administradores, gerentes y cajeros con permisos específicos.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Multi-Sucursal',
    desc: 'Administra varias ubicaciones desde un solo panel con visibilidad completa.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    ),
    title: 'Reportes de Ventas',
    desc: 'Visualiza el desempeño de ventas por día, sucursal y método de pago en tiempo real.',
  },
]

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100dvh', background: '#0A0A0A', position: 'relative', overflow: 'hidden' }}>

      {/* Grain texture overlay */}
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
        background: 'linear-gradient(90deg, #FF4400 0%, #FF6633 50%, transparent 100%)',
      }} />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: '3px', left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: '58px',
        background: 'rgba(10,10,10,0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #282828',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '2px',
            background: '#FF4400',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
              <rect x="7" y="14" width="10" height="6" rx="1"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-syne)', fontSize: '17px',
            letterSpacing: '0.12em', color: '#F0F0F0',
          }}>
            AUTOPARTES GUERRERO
          </span>
        </div>
        <Link
          href="/login"
          className="btn-accent"
          style={{ fontSize: '11px', padding: '8px 18px' }}
        >
          Acceder al sistema
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: '61px',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
      }}>

        {/* Background radial glow */}
        <div aria-hidden style={{
          position: 'absolute', right: '-15%', top: '10%',
          width: '700px', height: '700px',
          background: 'radial-gradient(ellipse, rgba(255,68,0,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Grid */}
        <div className="bg-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />

        <div style={{ position: 'relative', padding: '60px 40px 0' }}>

          {/* Overline */}
          <div className="animate-fade-up" style={{
            display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px',
          }}>
            <div style={{ width: '40px', height: '1px', background: '#FF4400' }} />
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.25em',
              textTransform: 'uppercase', color: '#FF4400',
            }}>
              Sistema de Gestión Empresarial
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="animate-fade-up delay-100"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(72px, 14vw, 152px)',
              lineHeight: 0.88,
              letterSpacing: '0.04em',
              color: '#F0F0F0',
              marginBottom: '0',
            }}
          >
            INVENTARIOS
          </h1>
          <h1
            className="animate-fade-up delay-200"
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 'clamp(72px, 14vw, 152px)',
              lineHeight: 0.88,
              letterSpacing: '0.04em',
              color: '#FF4400',
              marginBottom: '36px',
            }}
          >
            GUERRERO
          </h1>

          {/* Subtitle + CTA row */}
          <div className="animate-fade-up delay-300" style={{
            display: 'flex', alignItems: 'flex-end', gap: '48px', flexWrap: 'wrap',
          }}>
            <p style={{
              fontSize: '15px', color: '#888888', maxWidth: '400px', lineHeight: 1.75,
            }}>
              Gestión de inventario y punto de venta para equipos modernos.
              Busca, vende y controla tu stock desde cualquier sucursal.
            </p>
            <Link href="/login" className="btn-accent" style={{ fontSize: '13px', padding: '13px 32px', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Acceder
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="animate-fade-up delay-500" style={{
          marginTop: '64px',
          borderTop: '1px solid #282828',
          borderBottom: '1px solid #282828',
          display: 'flex',
          position: 'relative',
        }}>
          {[
            { value: '3', label: 'Roles de usuario', sub: 'Admin · Manager · Cajero' },
            { value: '3', label: 'Métodos de pago', sub: 'Efectivo · Tarjeta · Transferencia' },
            { value: '∞', label: 'Sucursales', sub: 'Escala sin límites' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, padding: '28px 40px',
              borderRight: i < 2 ? '1px solid #282828' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-syne)',
                fontSize: '52px', lineHeight: 1, color: '#FF4400',
                marginBottom: '6px',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '12px', fontWeight: 600, color: '#F0F0F0',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px',
              }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '11px', color: '#444444', letterSpacing: '0.04em' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features section */}
      <section style={{ padding: '80px 40px 100px', maxWidth: '1160px', margin: '0 auto', width: '100%' }}>

        {/* Section header */}
        <div className="animate-fade-up" style={{
          display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px',
        }}>
          <span style={{
            fontFamily: 'var(--font-syne)',
            fontSize: '11px', letterSpacing: '0.25em', color: '#FF4400',
          }}>
            CAPACIDADES
          </span>
          <div style={{ flex: 1, height: '1px', background: '#282828' }} />
          <span style={{ fontSize: '11px', color: '#444444', letterSpacing: '0.1em' }}>
            {features.length} MÓDULOS
          </span>
        </div>

        {/* Feature grid — borders as design elements */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1px',
          background: '#282828',
          border: '1px solid #282828',
          borderRadius: '0',
          overflow: 'hidden',
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className={`feature-card animate-fade-up delay-${(i % 4) * 100 + 100}`}
              style={{ background: '#0A0A0A', padding: '32px 28px' }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '2px',
                background: 'rgba(255,68,0,0.08)',
                border: '1px solid rgba(255,68,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FF4400', marginBottom: '20px',
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontSize: '13px', fontWeight: 700, color: '#F0F0F0',
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
              }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#888888', lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #282828',
        padding: '20px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '11px', color: '#444444', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        <span>© {new Date().getFullYear()} Autopartes Guerrero</span>
        <span>Sistema de Gestión Empresarial</span>
      </footer>
    </main>
  )
}
