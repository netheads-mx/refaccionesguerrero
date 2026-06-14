import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'ag_token'

export { COOKIE_NAME }

export interface AuthPayload {
  userId: number
  email: string
  nombre: string
  apellido: string
  rol: 'administrador' | 'manager' | 'cajero'
  sucursalId: number | null
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}
