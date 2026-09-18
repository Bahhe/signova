import * as React from 'react'
import type { Product } from './types'
import { INITIAL_PRODUCTS } from './sample-data'

const LOCAL_STORAGE_KEY = 'signova_products_cache'

function getInitialFromStorage(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Product[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed reading localStorage products:', err)
  }
  return INITIAL_PRODUCTS
}

function saveToStorage(products: Product[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products))
  } catch (err) {
    console.warn('Failed saving to localStorage:', err)
  }
}

export function useProducts() {
  const [products, setProducts] = React.useState<Product[]>(getInitialFromStorage)
  const [loading, setLoading] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products')
      if (res.ok) {
        const data = (await res.json()) as Product[]
        if (Array.isArray(data)) {
          setProducts(data)
          saveToStorage(data)
        }
      }
    } catch (err) {
      console.error('Failed fetching products from API:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const saveProduct = React.useCallback(async (product: Product): Promise<Product> => {
    const now = new Date().toISOString()
    const updated: Product = {
      ...product,
      updatedAt: now,
      createdAt: product.createdAt || now,
    }

    // Optimistic update
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id || p.slug === product.slug)
      let next: Product[]
      if (idx >= 0) {
        next = [...prev]
        next[idx] = updated
      } else {
        next = [updated, ...prev]
      }
      saveToStorage(next)
      return next
    })

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      if (res.ok) {
        const saved = (await res.json()) as Product
        setProducts((prev) => {
          const next = prev.map((p) => (p.id === saved.id ? saved : p))
          saveToStorage(next)
          return next
        })
        return saved
      }
    } catch (err) {
      console.warn('API save failed, using local optimistic copy:', err)
    }
    return updated
  }, [])

  const deleteProduct = React.useCallback(async (id: string): Promise<boolean> => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id)
      saveToStorage(next)
      return next
    })

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      return res.ok
    } catch (err) {
      console.warn('API delete failed, using local state:', err)
      return true
    }
  }, [])

  const getProduct = React.useCallback(
    (slugOrId: string): Product | undefined => {
      return products.find(
        (p) => p.id === slugOrId || p.slug.toLowerCase() === slugOrId.toLowerCase()
      )
    },
    [products]
  )

  return {
    products,
    loading,
    refresh,
    saveProduct,
    deleteProduct,
    getProduct,
  }
}
