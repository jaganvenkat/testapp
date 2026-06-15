import { filterProducts, ProductFilters } from '@/utils/products'

describe('filterProducts', () => {
  it('TC-001: applies search filter to product names', () => {
    const products = [
      { id: '1', name: 'Red Sneakers', price: 50, category: 'shoes' },
      { id: '2', name: 'Blue Jeans', price: 80, category: 'clothing' },
      { id: '3', name: 'Red Hat', price: 20, category: 'accessories' },
    ]
    const filters: ProductFilters = { search: 'red' }
    const result = filterProducts(products, filters)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Red Sneakers', 'Red Hat'])
    )
  })

  it('TC-002: applies minPrice range filter correctly', () => {
    const products = [
      { id: '1', name: 'Cheap Item', price: 10, category: 'misc' },
      { id: '2', name: 'Mid Item', price: 50, category: 'misc' },
      { id: '3', name: 'Expensive Item', price: 100, category: 'misc' },
    ]
    const filters: ProductFilters = { minPrice: 50 }
    const result = filterProducts(products, filters)
    expect(result.every((p) => p.price >= 50)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Mid Item', 'Expensive Item'])
    )
  })

  it('TC-003: applies maxPrice range filter correctly', () => {
    const products = [
      { id: '1', name: 'Cheap Item', price: 10, category: 'misc' },
      { id: '2', name: 'Mid Item', price: 50, category: 'misc' },
      { id: '3', name: 'Expensive Item', price: 100, category: 'misc' },
    ]
    const filters: ProductFilters = { maxPrice: 50 }
    const result = filterProducts(products, filters)
    expect(result.every((p) => p.price <= 50)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Cheap Item', 'Mid Item'])
    )
  })

  it('TC-004: composes search and price range filters', () => {
    const products = [
      { id: '1', name: 'Red Sneakers', price: 60, category: 'shoes' },
      { id: '2', name: 'Red Hat', price: 15, category: 'accessories' },
      { id: '3', name: 'Blue Jeans', price: 70, category: 'clothing' },
      { id: '4', name: 'Red Scarf', price: 90, category: 'accessories' },
    ]
    const filters: ProductFilters = { search: 'red', minPrice: 20, maxPrice: 80 }
    const result = filterProducts(products, filters)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Red Sneakers')
  })

  it('TC-005: handles empty products array', () => {
    const filters: ProductFilters = { search: 'anything', minPrice: 10, maxPrice: 100 }
    const result = filterProducts([], filters)
    expect(result).toEqual([])
  })

  it('TC-006: handles undefined or missing filter properties', () => {
    const products = [
      { id: '1', name: 'Widget', price: 25, category: 'tools' },
      { id: '2', name: 'Gadget', price: 75, category: 'electronics' },
      { id: '3', name: 'Doohickey', price: 5, category: 'misc' },
    ]
    const filters: ProductFilters = { minPrice: 20 }
    const result = filterProducts(products, filters)
    expect(result.every((p) => p.price >= 20)).toBe(true)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Widget', 'Gadget'])
    )
  })

  it('TC-007: integrates with existing category filter', () => {
    const products = [
      { id: '1', name: 'Red Sneakers', price: 60, category: 'shoes' },
      { id: '2', name: 'Red Boots', price: 120, category: 'shoes' },
      { id: '3', name: 'Red Hat', price: 30, category: 'accessories' },
      { id: '4', name: 'Blue Sneakers', price: 55, category: 'shoes' },
    ]
    const filters: ProductFilters = {
      category: 'shoes',
      search: 'red',
      minPrice: 50,
      maxPrice: 100,
    }
    const result = filterProducts(products, filters)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Red Sneakers')
  })

  it('TC-008: handles minPrice equal to maxPrice', () => {
    const products = [
      { id: '1', name: 'Item A', price: 50, category: 'misc' },
      { id: '2', name: 'Item B', price: 75, category: 'misc' },
      { id: '3', name: 'Item C', price: 100, category: 'misc' },
    ]
    const filters: ProductFilters = { minPrice: 75, maxPrice: 75 }
    const result = filterProducts(products, filters)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Item B')
    expect(result[0].price).toBe(75)
  })
})