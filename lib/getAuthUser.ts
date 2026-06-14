import { cookies } from 'next/headers'
import { verifyToken, AuthPayload, COOKIE_NAME } from './auth'

export async function getAuthUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
