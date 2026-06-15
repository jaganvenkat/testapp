import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateProduct } from '@/utils/validation'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const products = category
    ? db.products.findByCategory(category)
    : db.products.list()

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = validateProduct(body)

  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
  }

  const product = db.products.create({
    id:          crypto.randomUUID(),
    name:        result.data.name,
    price:       result.data.price,
    stock:       result.data.stock,
    category:    result.data.category,
    description: result.data.description,
    createdAt:   new Date(),
  })

  return NextResponse.json({ product }, { status: 201 })
}
