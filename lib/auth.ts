import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SECRET = process.env.JWT_SECRET || 'dev-secret'

export interface TokenPayload {
  userId: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload
}

export function getAuth(req: NextRequest): TokenPayload | null {
  try {
    const header = req.headers.get('authorization')
    const token = header?.split(' ')[1]
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): TokenPayload {
  const auth = getAuth(req)
  if (!auth) throw new Error('UNAUTHORIZED')
  return auth
}
