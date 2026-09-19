import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
import type { ProductImage, StorefrontSocialLinks } from '#/lib/types'

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

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: text('role').notNull().default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect

export const storefrontSettings = pgTable('storefront_settings', {
  id: text('id').primaryKey().default('storefront'),
  storeName: text('store_name').notNull().default('Signova'),
  storeDescription: text('store_description').notNull().default(''),
  phone: text('phone').notNull().default(''),
  secondaryPhone: text('secondary_phone').default(''),
  email: text('email').notNull().default(''),
  location: text('location').notNull().default(''),
  locationUrl: text('location_url').default(''),
  workingHours: text('working_hours').default(''),
  socialLinks: jsonb('social_links')
    .$type<StorefrontSocialLinks>()
    .notNull()
    .default({}),
  metaPixelId: text('meta_pixel_id').default(''),
  logoUrl: text('logo_url').default(''),
  faviconUrl: text('favicon_url').default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type DbStorefrontSettings = typeof storefrontSettings.$inferSelect
export type DbNewStorefrontSettings = typeof storefrontSettings.$inferInsert
