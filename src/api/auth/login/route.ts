import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateLogin } from '@/utils/validation'
import { verifyPassword, generateToken } from '@/utils/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = validateLogin(body)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  const user = db.users.findByEmail(result.data.email)
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await verifyPassword(result.data.password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role })
  const { password: _, ...safe } = user

  return NextResponse.json({ token, user: safe })
}
