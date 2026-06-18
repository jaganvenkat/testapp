import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  const notifications = db.notifications.findByUserId(userId)
  return NextResponse.json({ notifications })
}

export async function POST(req: NextRequest) {
  const { userId, title, body, type = 'info' } = await req.json()
  if (!userId || !title || !body) {
    return NextResponse.json({ error: 'userId, title, and body are required' }, { status: 400 })
  }
  const notification = db.notifications.create({
    id: crypto.randomUUID(),
    userId,
    title,
    body,
    type,
    read: false,
    createdAt: new Date(),
  })
  return NextResponse.json({ notification }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, userId, markAll } = await req.json()
  if (markAll && userId) {
    db.notifications.markAllRead(userId)
    return NextResponse.json({ ok: true })
  }
  if (id) {
    const updated = db.notifications.markRead(id)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ notification: updated })
  }
  return NextResponse.json({ error: 'id or markAll+userId required' }, { status: 400 })
}
