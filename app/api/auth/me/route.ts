import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return NextResponse.json(null, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json(null, { status: 401 })

  return NextResponse.json(payload)
}
