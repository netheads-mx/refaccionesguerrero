import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/auth'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const rol = payload.rol as string

    if (pathname.startsWith('/admin')) {
      if (rol !== 'administrador' && rol !== 'manager') {
        return NextResponse.redirect(new URL('/caja', request.url))
      }
    }

    if (pathname.startsWith('/caja')) {
      if (!['administrador', 'manager', 'cajero'].includes(rol)) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/caja/:path*'],
}
