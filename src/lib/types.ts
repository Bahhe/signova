export interface ProductImage {
  id: string
  url: string
  name: string
  size?: number
}

export interface Product {
  id: string
  title: string
  slug: string
  description: string
  images: ProductImage[]
  price?: string
  category?: string
  features?: string[]
  ctaText?: string
  ctaUrl?: string
  badge?: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, '') // trim - from end of text
}
