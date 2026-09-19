import * as React from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Maximize2,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ShoppingCart,
  ExternalLink,
  EyeOff,
  LayoutDashboard,
  Store,
} from 'lucide-react'
import type { Product, ProductImage, StorefrontSettings } from '#/lib/types'
import { authClient } from '#/lib/auth-client'
import {
  initMetaPixel,
  trackPageView,
  trackViewContent,
  parseNumericPrice,
} from '#/lib/meta-pixel'
import { MetaPixelScript } from './meta-pixel-script'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ThemeToggle } from './theme-toggle'
import { OrderForm } from './order-form'
import { StorefrontFooter } from './storefront-footer'

interface ProductPageViewProps {
  product: Product
  settings?: StorefrontSettings | null
  isAdmin?: boolean
}

export function ProductPageView({
  product,
  settings,
  isAdmin: isAdminProp,
}: ProductPageViewProps) {
  const { data: session } = authClient.useSession()
  const sessionIsAdmin =
    (session?.user as { role?: string } | undefined)?.role === 'admin'
  const isUserAdmin = isAdminProp ?? sessionIsAdmin

  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Drag & Swipe gesture state
  const [dragOffset, setDragOffset] = React.useState(0)
  const touchStartX = React.useRef<number | null>(null)
  const touchStartY = React.useRef<number | null>(null)
  const isMouseDown = React.useRef(false)
  const mouseStartX = React.useRef(0)

  const images = product.images
  const currentImage: ProductImage | undefined =
    images[selectedImageIndex] ?? images[0]

  React.useEffect(() => {
    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0)
    }
  }, [images.length, selectedImageIndex])

  // Meta Pixel PageView & ViewContent Event tracking
  React.useEffect(() => {
    const pixelId = settings?.metaPixelId
    if (pixelId) {
      initMetaPixel(pixelId)
      // View page event
      trackPageView({
        page_title: product.title,
        page_path: `/p/${product.slug}`,
      })
      // ViewContent standard e-commerce event
      trackViewContent({
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: parseNumericPrice(product.price),
        currency: 'DZD',
      })
    }
  }, [
    settings?.metaPixelId,
    product.id,
    product.title,
    product.slug,
    product.price,
  ])

  const nextImage = React.useCallback(() => {
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const prevImage = React.useCallback(() => {
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation: Left key goes back/prev, Right key goes forward/next
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') setLightboxOpen(false)
        if (e.key === 'ArrowLeft' && images.length > 1) {
          prevImage()
        }
        if (e.key === 'ArrowRight' && images.length > 1) {
          nextImage()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, images.length, prevImage, nextImage])

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      images.length <= 1
    )
      return
    const diffX = e.touches[0].clientX - touchStartX.current
    const diffY = e.touches[0].clientY - touchStartY.current

    // Only swipe if movement is predominantly horizontal
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX)
    }
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || images.length <= 1) return
    const threshold = 40
    if (dragOffset > threshold) {
      prevImage()
    } else if (dragOffset < -threshold) {
      nextImage()
    }
    touchStartX.current = null
    touchStartY.current = null
    setDragOffset(0)
  }

  // Mouse handlers for desktop dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (images.length <= 1) return
    isMouseDown.current = true
    mouseStartX.current = e.clientX
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current || images.length <= 1) return
    const diffX = e.clientX - mouseStartX.current
    setDragOffset(diffX)
  }

  const handleMouseUp = () => {
    if (!isMouseDown.current || images.length <= 1) return
    const threshold = 40
    if (dragOffset > threshold) {
      prevImage()
    } else if (dragOffset < -threshold) {
      nextImage()
    }
    isMouseDown.current = false
    setDragOffset(0)
  }

  const handleMouseLeave = () => {
    if (isMouseDown.current) {
      handleMouseUp()
    }
  }

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      dir="rtl"
      className="w-full min-h-screen bg-background text-foreground transition-colors font-arabic flex flex-col"
    >
      <MetaPixelScript pixelId={settings?.metaPixelId} />

      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <Link
              to="/p"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity"
              title="العودة إلى المعرض"
            >
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName || 'Store Logo'}
                  className="h-8 w-auto max-w-[120px] object-contain rounded-md"
                />
              ) : (
                <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Store className="size-4" />
                </div>
              )}
              <span className="font-bold text-sm text-foreground hidden sm:inline-block">
                {settings?.storeName || 'Signova'}
              </span>
            </Link>

            {isUserAdmin && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 text-xs font-semibold h-8 border-border hover:bg-muted text-foreground transition-colors shadow-2xs"
              >
                <Link to="/" title="الذهاب إلى لوحة التحكم">
                  <LayoutDashboard className="size-3.5 text-primary" />
                  <span className="hidden md:inline">لوحة التحكم</span>
                </Link>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button
              size="xs"
              variant="outline"
              onClick={handleShare}
              className="text-xs gap-1.5 h-8 font-medium"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Share2 className="size-3.5" />
              )}
              {copied ? 'تم النسخ!' : 'مشاركة'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 flex-1 w-full">
        {/* Draft Notice if unpublished */}
        {!product.published && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <EyeOff className="size-4 shrink-0" />
              <span>
                <strong>وضع المسودة:</strong> صفحة هذا المنتج غير منشورة حالياً
                وتظهر للمشرفين فقط.
              </span>
            </div>
            {isUserAdmin && (
              <Button
                variant="outline"
                size="xs"
                asChild
                className="shrink-0 text-xs gap-1 h-7 border-amber-500/30 hover:bg-amber-500/20"
              >
                <Link to="/">
                  <LayoutDashboard className="size-3 text-amber-600 dark:text-amber-400" />
                  <span>لوحة التحكم</span>
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Gallery */}
        <div className="space-y-4">
          <div
            className="relative aspect-4/3 sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-muted/30 border border-border group select-none touch-pan-y cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {currentImage ? (
              <div
                className="h-full w-full flex items-center justify-center will-change-transform"
                style={{
                  transform: dragOffset
                    ? `translateX(${dragOffset}px)`
                    : undefined,
                  transition: dragOffset ? 'none' : 'transform 250ms ease-out',
                }}
              >
                <img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt={product.title}
                  draggable={false}
                  className="h-full w-full object-contain bg-muted/10 pointer-events-none select-none"
                />
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
                <ImageIcon className="size-10 opacity-30 mb-2" />
                <p className="text-xs">لا توجد صور متوفرة</p>
              </div>
            )}

            {currentImage && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 start-3 p-1.5 rounded-lg bg-background/80 hover:bg-background text-foreground backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-xs z-10"
                title="تكبير الصورة"
              >
                <Maximize2 className="size-4" />
              </button>
            )}

            {images.length > 1 && (
              <>
                {/* Left Button (Go to Previous Image) */}
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/85 hover:bg-background text-foreground backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-md z-10 hover:scale-105 active:scale-95"
                  title="الصورة السابقة"
                >
                  <ChevronLeft className="size-5" />
                </button>

                {/* Right Button (Go to Next Image) */}
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/85 hover:bg-background text-foreground backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-md z-10 hover:scale-105 active:scale-95"
                  title="الصورة التالية"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            {images.length > 0 && (
              <div
                className="absolute bottom-3 end-3 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-xs border border-border/60 text-[11px] font-medium font-sans z-10 pointer-events-none"
                dir="ltr"
              >
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnails Strip with Generous Vertical Space */}
          {images.length > 1 && (
            <div className="py-3 px-2 flex gap-3 overflow-x-auto scrollbar-none items-center">
              {images.map((img, idx) => {
                const isSelected = idx === selectedImageIndex
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative shrink-0 size-16 sm:size-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary ring-4 ring-primary/25 shadow-md scale-105'
                        : 'border-border/60 opacity-60 hover:opacity-100 hover:border-foreground/30'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.name || `صورة مصغرة ${idx + 1}`}
                      className="h-full w-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />
                    <span className="absolute bottom-1 start-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white leading-tight font-sans">
                      #{idx + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Product Details Header */}
        <div className="space-y-6 pt-2 border-t border-border">
          {/* Badges & Category */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {product.category}
              </Badge>
            )}
            {product.badge && (
              <Badge variant="default" className="text-xs font-semibold">
                {product.badge}
              </Badge>
            )}
          </div>

          {/* Title & Price & CTA Banner */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              {product.title}
            </h1>

            {product.price && (
              <div className="text-2xl sm:text-3xl font-black text-primary shrink-0">
                {product.price} دج
              </div>
            )}
          </div>

          {/* Call to Action bar */}
          {(product.ctaText || product.ctaUrl || product.price) && (
            <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  هل ترغب في طلب هذا المنتج؟
                </p>
                <p className="text-sm font-bold text-foreground">
                  {product.price
                    ? `متوفر الآن بسعر ${product.price} دج`
                    : 'متوفر الآن للشحن والتوصيل الفوري'}
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto font-bold text-sm shadow-sm gap-2"
              >
                <a href={product.ctaUrl || '#order'}>
                  <ShoppingCart className="size-4" />
                  <span>{product.ctaText || 'اطلب الآن'}</span>
                  {product.ctaUrl && product.ctaUrl.startsWith('http') && (
                    <ExternalLink className="size-3.5 opacity-80" />
                  )}
                </a>
              </Button>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              نظرة عامة على المنتج
            </h2>
            <div className="text-sm sm:text-base text-foreground/90 whitespace-pre-line leading-relaxed">
              {product.description || 'لا يوجد وصف متوفر.'}
            </div>
          </div>

          {/* Key Features List */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                المواصفات والمميزات الرئيسية
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-card text-xs sm:text-sm font-medium"
                  >
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Order Form Section */}
        <div className="pt-4 border-t border-border">
          <OrderForm product={product} />
        </div>
      </main>

      <StorefrontFooter settings={settings} />

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in font-arabic"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 start-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10"
              title="إغلاق"
            >
              <X className="size-6" />
            </button>

            <img
              src={currentImage.url}
              alt={product.title}
              className="max-h-[80vh] max-w-full rounded-lg object-contain select-none pointer-events-none"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <div
                className="mt-4 flex items-center gap-4 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left Arrow: Previous */}
                <button
                  type="button"
                  onClick={prevImage}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30"
                  title="السابق"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="text-xs font-sans" dir="ltr">
                  {selectedImageIndex + 1} / {images.length}
                </span>
                {/* Right Arrow: Next */}
                <button
                  type="button"
                  onClick={nextImage}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30"
                  title="التالي"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
