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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdministrador()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId || isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const body = await request.json()
    const { nombre, apellido, email, password, rol, sucursalId, activo } = body

    if (!nombre?.trim())   return NextResponse.json({ error: 'Nombre requerido' },   { status: 400 })
    if (!apellido?.trim()) return NextResponse.json({ error: 'Apellido requerido' }, { status: 400 })
    if (!email?.trim())    return NextResponse.json({ error: 'Email requerido' },    { status: 400 })
    if (!rol)              return NextResponse.json({ error: 'Rol requerido' },       { status: 400 })
    if (rol !== 'administrador' && !sucursalId)
      return NextResponse.json({ error: 'Sucursal requerida' }, { status: 400 })

    const duplicate = await prisma.usuario.findFirst({
      where: { email: email.trim().toLowerCase(), NOT: { id: numId } },
    })
    if (duplicate) return NextResponse.json({ error: 'Ese email ya está en uso' }, { status: 409 })

    const data: Record<string, unknown> = {
      nombre:     nombre.trim(),
      apellido:   apellido.trim(),
      email:      email.trim().toLowerCase(),
      rol,
      sucursalId: sucursalId ? Number(sucursalId) : null,
      ...(activo !== undefined ? { activo } : {}),
    }
    if (password?.trim()) {
      data.password = await bcrypt.hash(password, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id: numId },
      data,
      select: {
        id: true, nombre: true, apellido: true, email: true,
        rol: true, activo: true, creadoEn: true,
        sucursal: { select: { id: true, nombre: true } },
      },
    })
    return NextResponse.json(usuario)
  } catch (err) {
    console.error('[PATCH /api/admin/usuarios/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdministrador()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const numId = Number(id)
    if (!numId || isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    await prisma.usuario.update({ where: { id: numId }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/admin/usuarios/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
