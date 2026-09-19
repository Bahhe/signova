import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  PackageCheck,
  ArrowRight,
  Copy,
  Check,
  Store,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { getStorefrontSettingsServerFn } from '#/lib/server-settings'
import {
  initMetaPixel,
  trackPageView,
  trackPurchase,
  parseNumericPrice,
} from '#/lib/meta-pixel'
import { MetaPixelScript } from '#/components/meta-pixel-script'
import { DirectionProvider } from '#/components/direction-provider'
import { StorefrontFooter } from '#/components/storefront-footer'
import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'

interface ThankYouSearchParams {
  orderId?: string
  productId?: string
  productTitle?: string
  price?: string
  quantity?: number
  total?: string
  value?: number
  currency?: string
  deliveryType?: string
  fullName?: string
  phone?: string
  wilaya?: string
  commune?: string
}

export const Route = createFileRoute('/thank-you')({
  validateSearch: (search: Record<string, unknown>): ThankYouSearchParams => ({
    orderId: typeof search.orderId === 'string' ? search.orderId : undefined,
    productId:
      typeof search.productId === 'string' ? search.productId : undefined,
    productTitle:
      typeof search.productTitle === 'string' ? search.productTitle : undefined,
    price: typeof search.price === 'string' ? search.price : undefined,
    quantity: search.quantity ? Number(search.quantity) : 1,
    total: typeof search.total === 'string' ? search.total : undefined,
    value: search.value ? Number(search.value) : undefined,
    currency: typeof search.currency === 'string' ? search.currency : 'DZD',
    deliveryType:
      typeof search.deliveryType === 'string' ? search.deliveryType : undefined,
    fullName: typeof search.fullName === 'string' ? search.fullName : undefined,
    phone: typeof search.phone === 'string' ? search.phone : undefined,
    wilaya: typeof search.wilaya === 'string' ? search.wilaya : undefined,
    commune: typeof search.commune === 'string' ? search.commune : undefined,
  }),
  loader: async () => {
    try {
      const settings = await getStorefrontSettingsServerFn().catch(() => null)
      return { serverSettings: settings }
    } catch {
      return { serverSettings: null }
    }
  },
  head: () => ({
    meta: [
      { title: 'شكراً لك! تم استلام طلبك بنجاح | SignovaPub' },
      {
        name: 'description',
        content:
          'تم استلام طلبكم بنجاح وسيتصل بكم فريق خدمة العملاء لتأكيد الطلب وشحنه بأسرع وقت.',
      },
    ],
  }),
  component: ThankYouPageRoute,
})

function ThankYouPageRoute() {
  const search = Route.useSearch()
  const { serverSettings } = Route.useLoaderData()
  const navigate = useNavigate()

  const [copied, setCopied] = React.useState(false)

  const orderId = search.orderId || 'ORD-CONFIRMED'
  const productTitle = search.productTitle || 'المنتج المختار'
  const quantity = search.quantity || 1
  const deliveryType = search.deliveryType || 'home delivery'

  // Determine numeric purchase amount
  const numericTotal = React.useMemo(() => {
    if (typeof search.value === 'number' && search.value > 0) {
      return search.value
    }
    if (search.total) {
      const parsed = parseNumericPrice(search.total)
      if (parsed > 0) return parsed
    }
    if (search.price) {
      const unit = parseNumericPrice(search.price)
      if (unit > 0) return unit * quantity
    }
    return 0
  }, [search.value, search.total, search.price, quantity])

  // Display Total
  const displayTotal = React.useMemo(() => {
    if (search.total) return search.total
    if (numericTotal > 0) {
      return `${numericTotal.toLocaleString('fr-FR')} دج`
    }
    return search.price || 'الدفع عند الاستلام'
  }, [search.total, numericTotal, search.price])

  // Fire Meta Pixel Purchase Event
  React.useEffect(() => {
    const pixelId = serverSettings?.metaPixelId
    if (pixelId) {
      initMetaPixel(pixelId)
      trackPageView({ page_path: '/thank-you', page_title: 'Thank You' })

      // Prevent duplicate Purchase tracking on reload for the same order
      const storageKey = `signova_pixel_purchased_${orderId}`
      const hasPurchased =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(storageKey)
          : null

      if (!hasPurchased) {
        trackPurchase({
          value: numericTotal,
          currency: search.currency || 'DZD',
          content_name: productTitle,
          content_ids: search.productId ? [search.productId] : undefined,
          num_items: quantity,
          order_id: orderId,
        })
        try {
          sessionStorage.setItem(storageKey, 'true')
        } catch {
          // ignore storage errors
        }
      }
    }
  }, [
    serverSettings?.metaPixelId,
    orderId,
    numericTotal,
    search.currency,
    productTitle,
    search.productId,
    quantity,
  ])

  const handleCopyOrderId = () => {
    if (!orderId) return
    navigator.clipboard.writeText(orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const storePhone = serverSettings?.phone || '+213 555 01 23 45'
  const whatsappNumber =
    serverSettings?.socialLinks?.whatsapp?.replace(/[^0-9]/g, '') ||
    storePhone.replace(/[^0-9]/g, '')

  return (
    <DirectionProvider dir="rtl">
      <div
        dir="rtl"
        className="min-h-screen bg-background text-foreground flex flex-col font-arabic selection:bg-primary/20 selection:text-primary"
      >
        <MetaPixelScript pixelId={serverSettings?.metaPixelId} />

        {/* Top Minimal Navigation */}
        <header className="border-b border-border/60 bg-card/70 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {serverSettings?.logoUrl ? (
                <img
                  src={serverSettings.logoUrl}
                  alt={serverSettings.storeName || 'Store Logo'}
                  className="h-8 w-auto max-w-[120px] object-contain rounded-md"
                />
              ) : (
                <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
                  {serverSettings?.storeName ? serverSettings.storeName.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <span className="font-bold text-sm tracking-tight">
                {serverSettings?.storeName || 'SignovaPub'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void navigate({ to: '/p' })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <Store className="size-3.5 ms-1.5" />
                المتجر
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Thank You Content */}
        <main className="flex-1 py-8 sm:py-12 px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Celebration Hero Box */}
            <div className="text-center space-y-3">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                <div className="relative size-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="size-11 stroke-[2.2]" />
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-0.5 text-xs font-medium"
                >
                  تم تأكيد استلام طلبك بنجاح!
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  شكراً لثقتكم بنا!
                </h1>
                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                  لقد تم تسجيل طلبكم في نظامنا بنجاح. سيتصل بكم فريق خدمة
                  العملاء قريباً عبر الهاتف لتأكيد العنوان وموعد التوصيل.
                </p>
              </div>
            </div>

            {/* Order Details Card */}
            <Card className="border border-border/80 bg-card shadow-md overflow-hidden rounded-2xl">
              {/* Card Header with Order ID */}
              <div className="p-4 sm:p-5 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">
                    رقم الطلبية:
                  </span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    {orderId}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-background px-2.5 py-1 rounded-md border border-border shadow-2xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span className="text-emerald-500">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>

              {/* Card Body - Order Information */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Product Summary */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      المنتج المطلوب
                    </span>
                    <h3 className="font-bold text-base text-foreground">
                      {productTitle}
                    </h3>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        الكمية: {quantity}
                      </Badge>
                      {search.price && (
                        <span className="text-xs text-muted-foreground">
                          سعر الوحدة: {search.price}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left space-y-1 shrink-0">
                    <span className="text-xs text-muted-foreground block text-left">
                      المجموع الصافي
                    </span>
                    <span className="text-xl font-black text-primary block">
                      {displayTotal}
                    </span>
                  </div>
                </div>

                {/* Customer & Delivery Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  {search.fullName && (
                    <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                      <span className="text-muted-foreground">
                        الاسم الكامل
                      </span>
                      <p className="font-semibold text-foreground text-sm">
                        {search.fullName}
                      </p>
                    </div>
                  )}

                  {search.phone && (
                    <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                      <span className="text-muted-foreground">رقم الهاتف</span>
                      <p
                        className="font-semibold text-foreground font-mono text-sm"
                        dir="ltr"
                      >
                        {search.phone}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                    <span className="text-muted-foreground">طريقة التوصيل</span>
                    <p className="font-semibold text-foreground text-sm">
                      {deliveryType === 'home delivery'
                        ? 'توصيل سريع إلى باب المنزل'
                        : 'استلام من مكتب التوصيل (Stop Desk)'}
                    </p>
                  </div>

                  <div className="space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                    <span className="text-muted-foreground">طريقة الدفع</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                      الدفع نقداً عند الاستلام (COD)
                    </p>
                  </div>

                  {(search.wilaya || search.commune) && (
                    <div className="sm:col-span-2 space-y-1 bg-muted/20 p-3 rounded-xl border border-border/40">
                      <span className="text-muted-foreground">
                        عنوان التوصيل
                      </span>
                      <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        <span>
                          {search.wilaya}{' '}
                          {search.commune ? `- ${search.commune}` : ''}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Next Steps / What happens now? */}
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>ما هي الخطوات القادمة؟</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-muted/30 p-3.5 rounded-xl border border-border/40 space-y-1.5 text-right">
                  <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-bold text-xs text-foreground">
                    تأكيد الطلب
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    سيتصل بكم مندوب خدمة الزبائن لتأكيد صحة العنوان ورقم الهاتف.
                  </p>
                </div>

                <div className="bg-muted/30 p-3.5 rounded-xl border border-border/40 space-y-1.5 text-right">
                  <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-bold text-xs text-foreground">
                    التجهيز والشحن
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    يتم فحص وتغليف طردكم بعناية وتسليمه لشركة التوصيل السريع.
                  </p>
                </div>

                <div className="bg-muted/30 p-3.5 rounded-xl border border-border/40 space-y-1.5 text-right">
                  <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="font-bold text-xs text-foreground">
                    الاستلام والدفع
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    يصلكم الطرد إلى باب داركم مع إمكانية المعاينة والدفع نقداً
                    عند الاستلام.
                  </p>
                </div>
              </div>
            </div>

            {/* Assistance and Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => void navigate({ to: '/p' })}
                  size="default"
                  className="w-full sm:w-auto gap-2 font-medium"
                >
                  <ArrowRight className="size-4" />
                  <span>تصفح المزيد من المنتجات</span>
                </Button>
              </div>

              {/* Customer support buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                      `مرحباً، أود الاستفسار بخصوص طلبيتي رقم ${orderId}`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>تواصل عبر واتساب</span>
                  </a>
                )}
                {storePhone && (
                  <a
                    href={`tel:${storePhone}`}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium border border-border bg-background hover:bg-muted px-3.5 py-2 rounded-lg transition-colors w-full sm:w-auto"
                  >
                    <Phone className="size-3.5" />
                    <span>اتصل بنا</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Storefront Footer in Arabic */}
        <StorefrontFooter settings={serverSettings} />
      </div>
    </DirectionProvider>
  )
}
