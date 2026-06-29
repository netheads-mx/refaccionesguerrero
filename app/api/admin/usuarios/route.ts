import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// User management is restricted to administrators only
async function requireAdministrador() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null
  if (!user || user.rol !== 'administrador') return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireAdministrador()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl
    const page  = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = [10, 20, 50, 100].includes(Number(searchParams.get('limit')))
      ? Number(searchParams.get('limit'))
      : 20
    const q            = searchParams.get('q')?.trim() ?? ''
    const activoParam  = searchParams.get('activo')
    const activoFilter = activoParam === null ? undefined : activoParam === 'true'

    const where: Record<string, unknown> = {}
    if (activoFilter !== undefined) where.activo = activoFilter
    if (q) {
      where.OR = [
        { nombre:   { contains: q, mode: 'insensitive' } },
        { apellido: { contains: q, mode: 'insensitive' } },
        { email:    { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, data] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, nombre: true, apellido: true, email: true,
          rol: true, activo: true, creadoEn: true,
          sucursal: { select: { id: true, nombre: true } },
        },
      }),
    ])

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error('[GET /api/admin/usuarios]', err)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAdministrador()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { nombre, apellido, email, password, rol, sucursalId } = body

    if (!nombre?.trim())   return NextResponse.json({ error: 'Nombre requerido' },    { status: 400 })
    if (!apellido?.trim()) return NextResponse.json({ error: 'Apellido requerido' },  { status: 400 })
    if (!email?.trim())    return NextResponse.json({ error: 'Email requerido' },     { status: 400 })
    if (!password?.trim()) return NextResponse.json({ error: 'Contraseña requerida' },{ status: 400 })
    if (!rol)              return NextResponse.json({ error: 'Rol requerido' },        { status: 400 })
    if (rol !== 'administrador' && !sucursalId)
      return NextResponse.json({ error: 'Sucursal requerida' }, { status: 400 })

    const existing = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: {
        nombre:     nombre.trim(),
        apellido:   apellido.trim(),
        email:      email.trim().toLowerCase(),
        password:   hashed,
        rol,
        sucursalId: sucursalId ? Number(sucursalId) : null,
      },
      select: {
        id: true, nombre: true, apellido: true, email: true,
        rol: true, activo: true, creadoEn: true,
        sucursal: { select: { id: true, nombre: true } },
      },
    })
    return NextResponse.json(usuario, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/usuarios]', err)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
