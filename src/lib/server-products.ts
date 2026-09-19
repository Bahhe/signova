import { createServerFn } from '@tanstack/react-start'
import type { Product } from './types.ts'

// TanStack Start Server Functions
// We dynamically import server/db-products inside handlers to guarantee that
// PostgreSQL/pg/drizzle-orm server dependencies are completely excluded from client bundles.
export const getProductsServerFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getAllProducts } = await import('#/server/db-products')
    return getAllProducts()
  },
)

export const getProductBySlugServerFn = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const { getProductBySlug } = await import('#/server/db-products')
    return getProductBySlug(slug)
  })

export const saveProductServerFn = createServerFn({ method: 'POST' })
  .validator((product: Product) => product)
  .handler(async ({ data: product }) => {
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers: headers as any })
    if (!session) {
      throw new Error('Unauthorized: You must be signed in to modify products')
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw new Error(
        'Forbidden: Administrator role required to modify products',
      )
    }
    const { saveProduct } = await import('#/server/db-products')
    return saveProduct(product)
  })

export const deleteProductServerFn = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers: headers as any })
    if (!session) {
      throw new Error('Unauthorized: You must be signed in to delete products')
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw new Error(
        'Forbidden: Administrator role required to delete products',
      )
    }
    const { deleteProduct } = await import('#/server/db-products')
    return deleteProduct(id)
  })
