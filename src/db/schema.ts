import { pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import type { ProductImage } from '#/lib/types'

export const todos = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  images: jsonb('images').$type<ProductImage[]>().notNull().default([]),
  price: text('price'),
  category: text('category'),
  badge: text('badge'),
  features: jsonb('features').$type<string[]>().default([]),
  ctaText: text('cta_text').default('Order Now'),
  ctaUrl: text('cta_url').default('#order'),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type DbProduct = typeof products.$inferSelect
export type DbNewProduct = typeof products.$inferInsert
