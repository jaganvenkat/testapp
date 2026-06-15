import { NextRequest } from 'next/server'
import type { ProductFilters } from '@/utils/products'

jest.mock('@/lib/db', () => ({
  db: {
    products: {
      list: jest.fn(),
      findByCategory: jest.fn(),
    },
  },
}))

jest.mock('@/utils/products', () => ({
  filterProducts: jest.fn(),
}))

import { db } from '@/lib/db'
import { filterProducts } from '@/utils/products'
import { GET } from '@/api/products/route'

const mockDb = db as jest.Mocked<typeof db>
const mockFilterProducts = filterProducts as jest.MockedFunction<typeof filterProducts>

function makeRequest(url: string): NextRequest {
  return new NextRequest(url)
}

describe('filterProducts (unit)', () => {
  let realFilterProducts: typeof filterProducts

  beforeAll(async () => {
    jest.unmock('@/utils/products')
    const mod = await import('@/utils/products')
    realFilterProducts = mod.filterProducts
  })

  const sampleProducts = [
    { id: '1', name: 'iPhone', price: 999, stock: 10, category: 'electronics', description: 'A great smartphone' },
    { id: '2', name: 'Android Phone', price: 499, stock: 5, category: 'electronics', description: 'wireless charging' },
    { id: '3', name: 'Laptop', price: 1200, stock: 3, category: 'computers', description: 'powerful laptop' },
    { id: '4', name: 'Headphones', price: 150, stock: 20, category: 'electronics', description: 'noise cancelling' },
  ]

  describe('TC-002: handles undefined optional filter fields', () => {
    it('returns all products unchanged when all filter fields are undefined', () => {
      const filters: ProductFilters = {
        category: undefined,
        search: undefined,
        minPrice: undefined,
        maxPrice: undefined,
      }
      const result = realFilterProducts(sampleProducts, filters)
      expect(result).toHaveLength(sampleProducts.length)
      expect(result).toEqual(sampleProducts)
    })
  })

  describe('TC-003: search is case-insensitive and checks both name and description', () => {
    it('finds matches in name case-insensitively for PHONE', () => {
      const result = realFilterProducts(sampleProducts, { search: 'PHONE' })
      const names = result.map(p => p.name)
      expect(names).toContain('iPhone')
      expect(names).toContain('Android Phone')
    })

    it('finds matches in description for wireless', () => {
      const result = realFilterProducts(sampleProducts, { search: 'wireless' })
      expect(result.map(p => p.name)).toContain('Android Phone')
    })

    it('does not return products with no match in name or description', () => {
      const result = realFilterProducts(sampleProducts, { search: 'PHONE' })
      expect(result.map(p => p.name)).not.toContain('Laptop')
      expect(result.map(p => p.name)).not.toContain('Headphones')
    })
  })

  describe('TC-004: respects minPrice and maxPrice boundary conditions', () => {
    const priceProducts = [
      { id: '1', name: 'Cheap', price: 50, stock: 1, category: 'a', description: '' },
      { id: '2', name: 'MinBound', price: 100, stock: 1, category: 'a', description: '' },
      { id: '3', name: 'Mid', price: 200, stock: 1, category: 'a', description: '' },
      { id: '4', name: 'Expensive', price: 300, stock: 1, category: 'a', description: '' },
    ]

    it('includes products at exact minPrice and maxPrice boundaries', () => {
      const result = realFilterProducts(priceProducts, { minPrice: 100, maxPrice: 200 })
      const names = result.map(p => p.name)
      expect(names).toContain('MinBound')
      expect(names).toContain('Mid')
    })

    it('excludes products below minPrice', () => {
      const result = realFilterProducts(priceProducts, { minPrice: 100, maxPrice: 200 })
      expect(result.map(p => p.name)).not.toContain('Cheap')
    })

    it('excludes products above maxPrice', () => {
      const result = realFilterProducts(priceProducts, { minPrice: 100, maxPrice: 200 })
      expect(result.map(p => p.name)).not.toContain('Expensive')
    })
  })

  describe('TC-007: category filter exact-matches and rejects mismatched categories', () => {
    const categoryProducts = [
      { id: '1', name: 'Product A', price: 100, stock: 1, category: 'electronics', description: '' },
      { id: '2', name: 'Product B', price: 100, stock: 1, category: 'Electronics', description: '' },
      { id: '3', name: 'Product C', price: 100, stock: 1, category: 'electronic', description: '' },
      { id: '4', name: 'Product D', price: 100, stock: 1, category: 'computers', description: '' },
    ]

    it('returns only products with exact category match', () => {
      const result = realFilterProducts(categoryProducts, { category: 'electronics' })
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Product A')
    })

    it('excludes products with different case category', () => {
      const result = realFilterProducts(categoryProducts, { category: 'electronics' })
      expect(result.map(p => p.name)).not.toContain('Product B')
    })

    it('excludes products with partial category match', () => {
      const result = realFilterProducts(categoryProducts, { category: 'electronics' })
      expect(result.map(p => p.name)).not.toContain('Product C')
    })
  })
})

describe('GET /api/products (api/integration)', () => {
  const testProducts = [
    { id: '1', name: 'iPhone', price: 299, stock: 10, category: 'electronics', description: 'smartphone' },
    { id: '2', name: 'Cheap Phone', price: 150, stock: 5, category: 'electronics', description: 'budget phone' },
    { id: '3', name: 'Laptop', price: 999, stock: 2, category: 'computers', description: 'laptop' },
  ]

  beforeEach(() => {
    jest.resetAllMocks()
    mockDb.products.list.mockReturnValue(testProducts as any)
    mockFilterProducts.mockImplementation((products) => products)
  })

  describe('TC-001: applies all four filters composably', () => {
    it('parses all four query params and calls filterProducts with correct filters', async () => {
      const filteredProducts = [testProducts[0]]
      mockFilterProducts.mockReturnValue(filteredProducts as any)

      const req = makeRequest('http://localhost/api/products?category=electronics&search=phone&minPrice=100&maxPrice=500')
      const response = await GET(req)
      const body = await response.json()

      expect(mockFilterProducts).toHaveBeenCalledWith(
        testProducts,
        { category: 'electronics', search: 'phone', minPrice: 100, maxPrice: 500 }
      )
      expect(body.products).toEqual(filteredProducts)
    })
  })

  describe('TC-005: handles missing query parameters with undefined defaults', () => {
    it('calls filterProducts with all undefined values when no query params are provided', async () => {
      const req = makeRequest('http://localhost/api/products')
      const response = await GET(req)
      const body = await response.json()

      expect(mockDb.products.list).toHaveBeenCalledTimes(1)
      expect(mockFilterProducts).toHaveBeenCalledWith(
        testProducts,
        { category: undefined, search: undefined, minPrice: undefined, maxPrice: undefined }
      )
      expect(body.products).toEqual(testProducts)
    })
  })

  describe('TC-006: correctly converts minPrice and maxPrice to numbers', () => {
    it('converts valid numeric strings to numbers', async () => {
      const req = makeRequest('http://localhost/api/products?minPrice=100&maxPrice=500')
      await GET(req)

      expect(mockFilterProducts).toHaveBeenCalledWith(
        testProducts,
        expect.objectContaining({ minPrice: 100, maxPrice: 500 })
      )

      const callArgs = mockFilterProducts.mock.calls[0][1]
      expect(typeof callArgs.minPrice).toBe('number')
      expect(typeof callArgs.maxPrice).toBe('number')
    })

    it('passes undefined for missing minPrice and maxPrice rather than NaN', async () => {
      const req = makeRequest('http://localhost/api/products')
      await GET(req)

      const callArgs = mockFilterProducts.mock.calls[0][1]
      expect(callArgs.minPrice).toBeUndefined()
      expect(callArgs.maxPrice).toBeUndefined()
    })
  })

  describe('TC-008: replaces old category-only logic with composite filterProducts call', () => {
    it('calls db.products.list() exactly once', async () => {
      const req = makeRequest('http://localhost/api/products?category=electronics')
      await GET(req)

      expect(mockDb.products.list).toHaveBeenCalledTimes(1)
    })

    it('does not call db.products.findByCategory()', async () => {
      const req = makeRequest('http://localhost/api/products?category=electronics')
      await GET(req)

      expect(mockDb.products.findByCategory).not.toHaveBeenCalled()
    })

    it('calls filterProducts with the full list and composite filters', async () => {
      const req = makeRequest('http://localhost/api/products?category=electronics')
      await GET(req)

      expect(mockFilterProducts).toHaveBeenCalledWith(
        testProducts,
        expect.objectContaining({ category: 'electronics' })
      )
    })
  })
})