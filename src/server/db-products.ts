import { eq, desc } from 'drizzle-orm'
import { db } from '#/db/index'
import { products as productsTable  } from '#/db/schema.ts'
import type {DbProduct} from '#/db/schema.ts';
import type {
  Product,
  ProductImage,
  ProductVariant,
  ProductVariantOption,
} from '../lib/types.ts'
import { INITIAL_PRODUCTS } from '../lib/sample-data.ts'

function mapDbToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    images: (row.images) || [],
    price: row.price || undefined,
    category: row.category || undefined,
    badge: row.badge || undefined,
    features: (row.features as string[]) || [],
    ctaText: row.ctaText || 'Order Now',
    ctaUrl: row.ctaUrl || '#order',
    published: row.published,
    variants: (row.variants) || [],
    variantOptions: (row.variantOptions) || [],
    createdAt: row.createdAt
      ? row.createdAt.toISOString()
      : new Date().toISOString(),
    updatedAt: row.updatedAt
      ? row.updatedAt.toISOString()
      : new Date().toISOString(),
  }
}

let isSeeded = false

async function ensureSeed(): Promise<void> {
  if (isSeeded) return
  try {
    const existing = await db.select().from(productsTable).limit(1)
    if (existing.length === 0) {
      console.log('Seeding initial products into PostgreSQL...')
      for (const p of INITIAL_PRODUCTS) {
        await db.insert(productsTable).values({
          id: p.id,
          title: p.title,
          slug: p.slug,
          description: p.description,
          images: p.images,
          price: p.price,
          category: p.category,
          badge: p.badge,
          features: p.features,
          ctaText: p.ctaText,
          ctaUrl: p.ctaUrl,
          published: p.published,
          variants: p.variants || [],
          variantOptions: p.variantOptions || [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })
      }
      console.log('PostgreSQL seeded successfully!')
    }
    isSeeded = true
  } catch (err) {
    console.warn('Could not seed initial products to PostgreSQL:', err)
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    await ensureSeed()
    const rows = await db
      .select()
      .from(productsTable)
      .orderBy(desc(productsTable.createdAt))

    return rows.map(mapDbToProduct)
  } catch (err) {
    console.error('Error in getAllProducts from PostgreSQL:', err)
    return INITIAL_PRODUCTS
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    await ensureSeed()
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.slug, slug.toLowerCase()))
      .limit(1)

    if (rows.length === 0) return null
    return mapDbToProduct(rows[0])
  } catch (err) {
    console.error('Error in getProductBySlug from PostgreSQL:', err)
    return (
      INITIAL_PRODUCTS.find(
        (p) => p.slug.toLowerCase() === slug.toLowerCase(),
      ) || null
    )
  }
}

export async function saveProduct(product: Product): Promise<Product> {
  const now = new Date()
  const productId = product.id || `prod-${Date.now()}`

  // Clean images and attempt automatic migration to S3 if base64 data URL is detected
  const cleanedImages: ProductImage[] = []
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      if (img.url && img.url.startsWith('data:image/')) {
        try {
          const { uploadToSeaweedFS } = await import('../lib/seaweedfs.ts')
          const uploaded = await uploadToSeaweedFS({
            base64Data: img.url,
            filename: img.name || 'image.jpg',
          })
          cleanedImages.push({
            id: uploaded.id,
            name: img.name || uploaded.name,
            url: uploaded.url,
            size: uploaded.size,
          })
        } catch (uploadErr) {
          console.warn(
            '[saveProduct] Could not upload base64 image to S3, keeping original:',
            uploadErr,
          )
          cleanedImages.push({
            id: img.id,
            url: img.url,
            name: img.name,
            size: img.size,
          })
        }
      } else {
        // Strip transient UI properties like isUploading, error
        cleanedImages.push({
          id: img.id,
          url: img.url,
          name: img.name,
          size: img.size,
        })
      }
    }
  }

  try {
    await db
      .insert(productsTable)
      .values({
        id: productId,
        title: product.title,
        slug: product.slug.toLowerCase(),
        description: product.description || '',
        images: cleanedImages,
        price: product.price,
        category: product.category,
        badge: product.badge,
        features: product.features || [],
        ctaText: product.ctaText || 'Order Now',
        ctaUrl: product.ctaUrl || '#order',
        published: product.published !== undefined ? product.published : true,
        variants: product.variants || [],
        variantOptions: product.variantOptions || [],
        createdAt: product.createdAt ? new Date(product.createdAt) : now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: productsTable.id,
        set: {
          title: product.title,
          slug: product.slug.toLowerCase(),
          description: product.description || '',
          images: cleanedImages,
          price: product.price,
          category: product.category,
          badge: product.badge,
          features: product.features || [],
          ctaText: product.ctaText || 'Order Now',
          ctaUrl: product.ctaUrl || '#order',
          published: product.published !== undefined ? product.published : true,
          variants: product.variants || [],
          variantOptions: product.variantOptions || [],
          updatedAt: now,
        },
      })

    return {
      ...product,
      id: productId,
      updatedAt: now.toISOString(),
    }
  } catch (err) {
    console.error('Error saving product to PostgreSQL:', err)
    throw err
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id))
    return true
  } catch (err) {
    console.error('Error deleting product from PostgreSQL:', err)
    return false
  }
}
