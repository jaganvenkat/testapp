import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateUser, validateLogin } from '@/utils/validation'
import { hashPassword, verifyPassword, generateToken } from '@/utils/auth'
import crypto from 'crypto'

export async function GET() {
  const users = db.users.list().map(({ password: _, ...u }) => u)
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = validateUser(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
  }

  const existing = db.users.findByEmail(result.data.email)
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hashed = await hashPassword(result.data.password)
  const user = db.users.create({
    id:        crypto.randomUUID(),
    name:      result.data.name,
    email:     result.data.email,
    password:  hashed,
    role:      result.data.role,
    createdAt: new Date(),
  })

  const { password: _, ...safe } = user
  return NextResponse.json({ user: safe }, { status: 201 })
}
