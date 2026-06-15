'use client'

import { useState, useEffect, useMemo } from 'react'

export interface SearchableProduct {
  id:           string
  name:         string
  price:        number
  stock:        number
  category:     string
  description?: string
}

export interface ProductSearchState {
  query:       string
  category:    string
  results:     SearchableProduct[]
  setQuery:    (q: string) => void
  setCategory: (c: string) => void
  reset:       () => void
}

export function useProductSearch(
  products: SearchableProduct[],
  debounceMs = 300,
): ProductSearchState {
  const [query, setQueryRaw] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), debounceMs)
    return () => clearTimeout(id)
  }, [query, debounceMs])

  const results = useMemo(() => {
    const lower = debouncedQuery.toLowerCase()
    return products.filter(p => {
      const matchesCategory = !category || p.category === category
      const matchesQuery =
        !lower ||
        p.name.toLowerCase().includes(lower) ||
        p.description?.toLowerCase().includes(lower)
      return matchesCategory && matchesQuery
    })
  }, [products, debouncedQuery, category])

  const reset = () => {
    setQueryRaw('')
    setDebouncedQuery('')
    setCategory('')
  }

  return { query, category, results, setQuery: setQueryRaw, setCategory, reset }
}
