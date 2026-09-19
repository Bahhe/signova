export interface ProductImage {
  id: string
  url: string
  name: string
  size?: number
  isUploading?: boolean
  error?: string
}

export interface ProductVariantOption {
  id: string
  name: string
  values: string[]
}

export interface ProductVariant {
  id: string
  title: string
  price?: string
  sku?: string
  inStock?: boolean
  imageId?: string
  imageUrl?: string
  options?: Record<string, string>
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
  variants?: ProductVariant[]
  variantOptions?: ProductVariantOption[]
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

export type DeliveryType = 'stopdesk' | 'home delivery'

export interface OrderInput {
  fullName: string
  phone: string
  wilaya: string
  commune: string
  deliveryType: DeliveryType
  productId: string
  productTitle: string
  productPrice?: string
  quantity?: number
  notes?: string
  variantId?: string
  variantTitle?: string
}

export interface Order extends OrderInput {
  id: string
  quantity: number
  totalAmount: string
  status: string
  createdAt: string
}

export interface OrderSubmissionResult {
  success: boolean
  orderId?: string
  message?: string
  error?: string
  simulated?: boolean
}

export interface StorefrontSocialLinks {
  facebook?: string
  instagram?: string
  tiktok?: string
  whatsapp?: string
  telegram?: string
  youtube?: string
  twitter?: string
  linkedin?: string
}

export interface StorefrontSettings {
  id: string
  storeName: string
  storeDescription: string
  phone: string
  secondaryPhone: string
  email: string
  location: string
  locationUrl?: string
  workingHours?: string
  socialLinks: StorefrontSocialLinks
  metaPixelId?: string
  logoUrl?: string
  faviconUrl?: string
  updatedAt?: string
}

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  id: 'storefront',
  storeName: 'SignovaPub',
  storeDescription:
    'وجهتكم الأولى للتسوق الإلكتروني الموثوق. نوفر لكم تشكيلة حصرية من أفضل المنتجات ذات الجودة العالية مع خدمة التوصيل السريع لجميع الولايات والدفع عند الاستلام.',
  phone: '+213 555 01 23 45',
  secondaryPhone: '+213 770 98 76 54',
  email: 'contact@signova.store',
  location: 'الجزائر العاصمة، الجزائر',
  locationUrl: 'https://maps.google.com',
  workingHours: 'خدمة الزبائن: 7/7 أيام من 09:00 إلى 20:00',
  metaPixelId: '',
  logoUrl: '',
  faviconUrl: '',
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    whatsapp: '+213555012345',
    telegram: 'https://t.me',
    youtube: '',
    twitter: '',
    linkedin: '',
  },
}
