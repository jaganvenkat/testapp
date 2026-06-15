import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
const SALT_ROUNDS = 10

export interface TokenPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) throw new Error('Password must be at least 8 characters')
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET)
  return decoded as TokenPayload
}

export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET)
    return false
  } catch {
    return true
  }
}
