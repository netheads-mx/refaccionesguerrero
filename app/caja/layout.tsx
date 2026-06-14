import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/getAuthUser'

export default async function CajaLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  return <>{children}</>
}
