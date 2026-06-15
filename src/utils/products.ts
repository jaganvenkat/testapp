interface Product {
  id:           string
  name:         string
  price:        number
  stock:        number
  category:     string
  description?: string
}

export interface ProductFilters {
  category?: string
  search?:   string
  minPrice?: number
  maxPrice?: number
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products.filter(p => {
    if (filters.category && p.category !== filters.category) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match = p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      if (!match) return false
    }
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false
    return true
  })
}
