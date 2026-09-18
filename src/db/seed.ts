import 'dotenv/config'
import { db } from './index'
import { products as productsTable } from './schema'
import { INITIAL_PRODUCTS } from '../lib/sample-data'

async function seed() {
  console.log('Seeding initial products into PostgreSQL database "signova"...')
  for (const p of INITIAL_PRODUCTS) {
    await db
      .insert(productsTable)
      .values({
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
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })
      .onConflictDoNothing()
  }
  console.log('Seed completed successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
