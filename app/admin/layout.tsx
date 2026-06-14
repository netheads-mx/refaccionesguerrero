import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/getAuthUser'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  if (!user) redirect('/login')
  if (user.rol === 'cajero') redirect('/caja')

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <AdminNav
        user={{
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          email: user.email,
        }}
      />
      <main className="admin-main" style={{ flex: 1, overflow: 'auto', background: '#0A0A0A' }}>
        {children}
      </main>
    </div>
  )
}
