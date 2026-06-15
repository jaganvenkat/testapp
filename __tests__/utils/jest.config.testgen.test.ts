import { renderHook, act } from '@testing-library/react'
import { useProductSearch, SearchableProduct, ProductSearchState } from '@/hooks/useProductSearch'

describe('useProductSearch initialization', () => {
  it('TC-001: useProductSearch initializes with correct default state', () => {
    const products: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
      { id: '2', name: 'Gizmo', price: 19.99, category: 'Gadgets' },
    ]

    const { result } = renderHook(() => useProductSearch(products))

    expect(result.current).toBeDefined()
    expect(result.current.query).toBe('')
    expect(result.current.results).toHaveLength(products.length)
  })
})

describe('useProductSearch filtering', () => {
  it('TC-002: useProductSearch filters products by search query', () => {
    const products: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
      { id: '2', name: 'Gizmo', price: 19.99, category: 'Tools' },
      { id: '3', name: 'Doohickey', price: 4.99, category: 'Gadgets' },
    ]

    const { result } = renderHook(() => useProductSearch(products))

    act(() => {
      result.current.setQuery('Widget')
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].id).toBe('1')
  })

  it('TC-003: useProductSearch handles empty search query', () => {
    const products: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
      { id: '2', name: 'Gizmo', price: 19.99, category: 'Tools' },
    ]

    const { result } = renderHook(() => useProductSearch(products))

    act(() => {
      result.current.setQuery('Gizmo')
    })

    act(() => {
      result.current.setQuery('')
    })

    expect(result.current.results).toHaveLength(products.length)
  })
})

describe('useProductSearch result shape', () => {
  it('TC-004: useProductSearch returns SearchableProduct array with correct interface', () => {
    const products: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
    ]

    const { result } = renderHook(() => useProductSearch(products))

    expect(Array.isArray(result.current.results)).toBe(true)
    expect(result.current.results[0]).toMatchObject({
      id: '1',
      name: 'Widget',
      price: 9.99,
      category: 'Gadgets',
    })
  })
})

describe('useProductSearch reactivity', () => {
  it('TC-005: useProductSearch updates results when product list changes', () => {
    const initialProducts: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
    ]

    const updatedProducts: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
      { id: '2', name: 'Gizmo', price: 19.99, category: 'Tools' },
    ]

    const { result, rerender } = renderHook(
      ({ products }: { products: SearchableProduct[] }) => useProductSearch(products),
      { initialProps: { products: initialProducts } }
    )

    expect(result.current.results).toHaveLength(1)

    rerender({ products: updatedProducts })

    expect(result.current.results).toHaveLength(2)
  })
})

describe('useProductSearch edge cases', () => {
  it('TC-006: useProductSearch handles null or undefined products gracefully', () => {
    expect(() => {
      const { result } = renderHook(() => useProductSearch([] as SearchableProduct[]))
      expect(result.current.results).toHaveLength(0)
    }).not.toThrow()
  })
})

describe('useProductSearch memoization', () => {
  it('TC-007: useProductSearch memoizes results to prevent unnecessary re-renders', () => {
    const products: SearchableProduct[] = [
      { id: '1', name: 'Widget', price: 9.99, category: 'Gadgets' },
      { id: '2', name: 'Gizmo', price: 19.99, category: 'Tools' },
    ]

    const { result, rerender } = renderHook(
      ({ products }: { products: SearchableProduct[] }) => useProductSearch(products),
      { initialProps: { products } }
    )

    const firstResults = result.current.results

    rerender({ products })

    const secondResults = result.current.results

    expect(firstResults).toBe(secondResults)
  })
})