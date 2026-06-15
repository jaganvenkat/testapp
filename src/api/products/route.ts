import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateProduct } from '@/utils/validation'
import { filterProducts } from '@/utils/products'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? undefined
  const search   = searchParams.get('search')   ?? undefined
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined

  const all      = db.products.list()
  const products = filterProducts(all, { category, search, minPrice, maxPrice })

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
