import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/utils/auth'
import { validatePlaceOrder } from '@/utils/validation'
import { randomUUID } from 'crypto'

function authenticate(req: NextRequest) {
  const header = req.headers.get('authorization') ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const payload = authenticate(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await req.json()
  const result = validatePlaceOrder(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  const { items } = result.data
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const order = db.orders.create({
    id:        randomUUID(),
    userId:    payload.userId,
    items,
    total,
    status:    'confirmed',
    createdAt: new Date(),
  })

  return NextResponse.json({ order }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const payload = authenticate(req)
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = db.orders.findByUserId(payload.userId)
  return NextResponse.json({ orders })
}
