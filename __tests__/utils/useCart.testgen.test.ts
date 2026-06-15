import { renderHook, act } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { useCart, CartItem } from '@/hooks/useCart'

describe('useCart.addItem', () => {
  it('adds new item with quantity 1 when item does not exist', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 10 })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ id: '1', name: 'Product', price: 10, quantity: 1 })
  })

  it('increments quantity when adding duplicate item', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 10 })
    })

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 10 })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })
})

describe('useCart.removeItem', () => {
  it('deletes item from cart by id', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({ id: '1', name: 'Product A', price: 10 })
      result.current.addItem({ id: '2', name: 'Product B', price: 20 })
    })

    act(() => {
      result.current.removeItem('1')
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe('2')
  })
})

describe('useCart.updateQty', () => {
  it('removes item when quantity is set to <= 0', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({ id: '1', name: 'Product', price: 10 })
    })

    act(() => {
      result.current.updateQty('1', 0)
    })

    expect(result.current.items).toHaveLength(0)
  })
})

describe('useCart.clearCart', () => {
  it('empties the items array', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({ id: '1', name: 'Product A', price: 10 })
      result.current.addItem({ id: '2', name: 'Product B', price: 20 })
    })

    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
  })
})

describe('useCart computed properties', () => {
  it('totalPrice and totalItems are correct', () => {
    const { result } = renderHook(() => useCart())

    act(() => {
      result.current.addItem({ id: '1', name: 'A', price: 10 })
    })

    act(() => {
      result.current.addItem({ id: '1', name: 'A', price: 10 })
    })

    act(() => {
      result.current.addItem({ id: '2', name: 'B', price: 15 })
    })

    expect(result.current.totalItems).toBe(3)
    expect(result.current.totalPrice).toBe(35)
  })
})