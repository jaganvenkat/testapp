import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  const orders = db.orders.findByUserId(userId)
  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, items } = body

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'userId and non-empty items are required' }, { status: 400 })
  }

  const total = items.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0,
  )

  const order = db.orders.create({
    id:        crypto.randomUUID(),
    userId,
    items,
    total,
    status:    'pending',
    createdAt: new Date(),
  })

  return NextResponse.json({ order }, { status: 201 })
}
