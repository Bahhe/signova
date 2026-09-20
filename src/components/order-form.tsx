import * as React from 'react'
import {
  User,
  Phone,
  MapPin,
  Building2,
  Truck,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Package,
  Clock,
  Layers,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type {
  Product,
  ProductVariant,
  DeliveryType,
  DeliveryRatesConfig,
} from '#/lib/types'
import { DEFAULT_DELIVERY_RATES } from '#/lib/types'
import { getWilayas, getCommunesForWilaya } from '#/lib/algeria-locations'
import { submitOrderServerFn } from '#/lib/server-orders'
import { parseNumericPrice } from '#/lib/meta-pixel'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface OrderFormProps {
  product: Product
  selectedVariant?: ProductVariant | null
  onSelectVariant?: (variant: ProductVariant) => void
  deliveryRates?: DeliveryRatesConfig
  className?: string
}

export function OrderForm({
  product,
  selectedVariant: propSelectedVariant,
  onSelectVariant,
  deliveryRates,
  className = '',
}: OrderFormProps) {
  const navigate = useNavigate()
  const wilayas = React.useMemo(() => getWilayas(), [])

  // Variant State
  const [internalVariant, setInternalVariant] =
    React.useState<ProductVariant | null>(
      () =>
        propSelectedVariant ??
        (product.variants && product.variants.length > 0
          ? product.variants[0]
          : null),
    )

  React.useEffect(() => {
    if (propSelectedVariant !== undefined) {
      setInternalVariant(propSelectedVariant)
    }
  }, [propSelectedVariant])

  const activeVariant =
    propSelectedVariant ??
    internalVariant ??
    (product.variants && product.variants.length > 0
      ? product.variants[0]
      : null)

  const effectivePrice = activeVariant?.price || product.price
  const isFreeDelivery = Boolean(product.freeDelivery)

  // Form State
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [selectedWilaya, setSelectedWilaya] = React.useState('')
  const [selectedCommune, setSelectedCommune] = React.useState('')
  const [deliveryType, setDeliveryType] =
    React.useState<DeliveryType>('home delivery')
  const [quantity, setQuantity] = React.useState(1)
  const [notes, setNotes] = React.useState('')

  // UI State
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = React.useState<{
    orderId: string
    message?: string
  } | null>(null)

  // Wilaya Shipping Rates calculation
  const wilayaRates = React.useMemo(() => {
    const config = deliveryRates || DEFAULT_DELIVERY_RATES
    const defaultHome = config.defaultHomePrice ?? 600
    const defaultDesk = config.defaultStopdeskPrice ?? 400

    if (!selectedWilaya) {
      return {
        homePrice: defaultHome,
        stopdeskPrice: defaultDesk,
        isCustom: false,
        isAvailable: true,
      }
    }

    const custom = config.wilayas?.[selectedWilaya]
    const homePrice =
      custom?.homePrice !== undefined && custom?.homePrice !== null
        ? custom.homePrice
        : defaultHome
    const stopdeskPrice =
      custom?.stopdeskPrice !== undefined && custom?.stopdeskPrice !== null
        ? custom.stopdeskPrice
        : defaultDesk
    const isAvailable = custom?.active !== false

    return {
      homePrice,
      stopdeskPrice,
      isCustom:
        (custom?.homePrice !== undefined && custom?.homePrice !== null) ||
        (custom?.stopdeskPrice !== undefined && custom?.stopdeskPrice !== null),
      isAvailable,
    }
  }, [deliveryRates, selectedWilaya])

  // Current active delivery fee
  const effectiveDeliveryFee = React.useMemo(() => {
    if (isFreeDelivery) return 0
    if (!selectedWilaya) return null
    return deliveryType === 'home delivery'
      ? wilayaRates.homePrice
      : wilayaRates.stopdeskPrice
  }, [isFreeDelivery, selectedWilaya, deliveryType, wilayaRates])

  // Get communes dynamically when Wilaya changes
  const availableCommunes = React.useMemo(() => {
    if (!selectedWilaya) return []
    return getCommunesForWilaya(selectedWilaya)
  }, [selectedWilaya])

  // Reset commune if Wilaya changes
  const handleWilayaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWilaya = e.target.value
    setSelectedWilaya(newWilaya)
    setSelectedCommune('')
  }

  // Calculate Subtotal & Grand Total
  const unitPriceNumeric = React.useMemo(
    () => parseNumericPrice(effectivePrice),
    [effectivePrice],
  )
  const productSubtotal = unitPriceNumeric * quantity

  const grandTotalNumeric = React.useMemo(() => {
    if (productSubtotal <= 0) return 0
    return productSubtotal + (effectiveDeliveryFee ?? 0)
  }, [productSubtotal, effectiveDeliveryFee])

  const subtotalDisplay = React.useMemo(() => {
    return productSubtotal > 0
      ? `${productSubtotal.toLocaleString('fr-FR')} دج`
      : effectivePrice || ''
  }, [productSubtotal, effectivePrice])

  const totalDisplay = React.useMemo(() => {
    if (grandTotalNumeric > 0) {
      return `${grandTotalNumeric.toLocaleString('fr-FR')} دج`
    }
    if (!effectivePrice) return null
    return `${productSubtotal.toLocaleString('fr-FR')} دج`
  }, [grandTotalNumeric, productSubtotal, effectivePrice])

  const handleVariantSelect = (v: ProductVariant) => {
    setInternalVariant(v)
    if (onSelectVariant) {
      onSelectVariant(v)
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check variant stock
    if (activeVariant && activeVariant.inStock === false) {
      setError(
        'نعتذر، الخيار المحدد غير متوفر حالياً في المخزون. يرجى اختيار خيار آخر.',
      )
      return
    }

    // Form validation
    if (!fullName.trim()) {
      setError('يرجى إدخال الاسم واللقب بالكامل.')
      return
    }

    const cleanPhone = phone.trim().replace(/[\s.-]/g, '')
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('يرجى إدخال رقم هاتف صحيح (مثال: 0555 12 34 56).')
      return
    }

    if (!selectedWilaya) {
      setError('يرجى اختيار الولاية من القائمة.')
      return
    }

    if (!selectedCommune) {
      setError('يرجى اختيار البلدية من القائمة.')
      return
    }

    const wilayaObj = wilayas.find((w) => w.code === selectedWilaya)
    const wilayaFormatted = wilayaObj
      ? `${wilayaObj.code} - ${wilayaObj.ar_name} (${wilayaObj.name})`
      : selectedWilaya

    if (wilayaRates.isAvailable === false) {
      setError('نعتذر، خدمة التوصيل غير متوفرة حالياً للولاية المختارة.')
      return
    }

    const feeVal = effectiveDeliveryFee ?? 0
    const homePriceFormatted = isFreeDelivery
      ? 'مجاني (0 دج)'
      : deliveryType === 'home delivery'
        ? `${feeVal} دج`
        : '-'
    const stopdeskPriceFormatted = isFreeDelivery
      ? 'مجاني (0 دج)'
      : deliveryType === 'stopdesk'
        ? `${feeVal} دج`
        : '-'

    const orderData = {
      fullName: fullName.trim(),
      phone: cleanPhone,
      wilaya: wilayaFormatted,
      commune: selectedCommune,
      deliveryType,
      deliveryFee: feeVal,
      homeDeliveryPrice: homePriceFormatted,
      stopdeskPrice: stopdeskPriceFormatted,
      isFreeDelivery,
      productId: product.id,
      productTitle: product.title,
      productPrice: effectivePrice,
      quantity,
      notes: notes.trim(),
      variantId: activeVariant?.id,
      variantTitle: activeVariant?.title,
    }

    setIsSubmitting(true)

    try {
      const res = await submitOrderServerFn({
        data: orderData,
      })

      if (res.success) {
        const confirmedOrderId = res.orderId || 'ORD-CONFIRMED'
        const numericTotal = grandTotalNumeric > 0 ? grandTotalNumeric : unitPriceNumeric * quantity

        setOrderSuccess({
          orderId: confirmedOrderId,
          message: res.message,
        })

        void navigate({
          to: '/thank-you',
          search: {
            orderId: confirmedOrderId,
            productId: product.id,
            productTitle: product.title,
            price: effectivePrice || '',
            quantity,
            total: totalDisplay || '',
            value: numericTotal,
            currency: 'DZD',
            deliveryType,
            deliveryFee: String(feeVal),
            isFreeDelivery: isFreeDelivery ? 'true' : 'false',
            fullName: fullName.trim(),
            phone: cleanPhone,
            wilaya: wilayaFormatted,
            commune: selectedCommune,
            variantTitle: activeVariant?.title,
          },
        })
        return
      } else {
        // Fallback REST endpoint
        const apiRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        })

        const data = await apiRes.json()
        if (apiRes.ok && data.success) {
          const confirmedOrderId = data.orderId || 'ORD-CONFIRMED'
          const numericTotal = grandTotalNumeric > 0 ? grandTotalNumeric : unitPriceNumeric * quantity

          setOrderSuccess({
            orderId: confirmedOrderId,
            message: data.message,
          })

          void navigate({
            to: '/thank-you',
            search: {
              orderId: confirmedOrderId,
              productId: product.id,
              productTitle: product.title,
              price: effectivePrice || '',
              quantity,
              total: totalDisplay || '',
              value: numericTotal,
              currency: 'DZD',
              deliveryType,
              deliveryFee: String(feeVal),
              isFreeDelivery: isFreeDelivery ? 'true' : 'false',
              fullName: fullName.trim(),
              phone: cleanPhone,
              wilaya: wilayaFormatted,
              commune: selectedCommune,
              variantTitle: activeVariant?.title,
            },
          })
          return
        } else {
          setError(
            data.error ||
              res.error ||
              'حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.',
          )
        }
      }
    } catch (err: any) {
      try {
        const apiRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        })
        const data = await apiRes.json()
        if (apiRes.ok && data.success) {
          const confirmedOrderId = data.orderId || 'ORD-CONFIRMED'
          const numericTotal = grandTotalNumeric > 0 ? grandTotalNumeric : unitPriceNumeric * quantity

          setOrderSuccess({
            orderId: confirmedOrderId,
            message: data.message,
          })

          void navigate({
            to: '/thank-you',
            search: {
              orderId: confirmedOrderId,
              productId: product.id,
              productTitle: product.title,
              price: effectivePrice || '',
              quantity,
              total: totalDisplay || '',
              value: numericTotal,
              currency: 'DZD',
              deliveryType,
              deliveryFee: String(feeVal),
              isFreeDelivery: isFreeDelivery ? 'true' : 'false',
              fullName: fullName.trim(),
              phone: cleanPhone,
              wilaya: wilayaFormatted,
              commune: selectedCommune,
              variantTitle: activeVariant?.title,
            },
          })
          return
        }
      } catch {
        // Fallback error below
      }
      setError(
        err.message || 'تعذر إرسال الطلب. يرجى التحقق من اتصالك بالإنترنت.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetForm = () => {
    setFullName('')
    setPhone('')
    setSelectedWilaya('')
    setSelectedCommune('')
    setDeliveryType('home delivery')
    setQuantity(1)
    setNotes('')
    setError(null)
    setOrderSuccess(null)
  }

  // If order was successfully submitted
  if (orderSuccess) {
    return (
      <div
        id="order"
        dir="rtl"
        className={`scroll-mt-20 rounded-2xl border border-emerald-500/30 bg-card p-6 sm:p-8 shadow-lg text-center transition-all ${className}`}
      >
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-10" />
        </div>

        <h3 className="text-2xl font-extrabold text-foreground mb-1">
          تم استلام طلبك بنجاح!
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          شكراً لثقتكم بنا! سنتصل بك هاتفياً في أقرب وقت لتأكيد العنوان
          والتوصيل.
        </p>

        <div className="mx-auto max-w-md rounded-xl border border-border/80 bg-muted/40 p-4 mb-6 text-right space-y-2.5 text-sm">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-border/60">
            <span className="text-muted-foreground">رقم الطلب:</span>
            <span className="font-mono font-bold text-foreground">
              {orderSuccess.orderId}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">المنتج:</span>
            <span className="font-medium text-foreground">
              {product.title} (x{quantity})
            </span>
          </div>
          {activeVariant && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">الخيار / الموديل:</span>
              <span className="font-bold text-foreground">
                {activeVariant.title}
              </span>
            </div>
          )}
          {totalDisplay && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">المبلغ الإجمالي:</span>
              <span className="font-bold text-primary">{totalDisplay}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">طريقة التوصيل:</span>
            <span className="font-medium text-foreground">
              {deliveryType === 'home delivery'
                ? 'توصيل إلى المنزل'
                : 'استلام من المكتب (Stop Desk)'}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto">
          فريق خدمة العملاء جاهز لخدمتكم، وسيتم تحضير طردكم وشحنه بأسرع وقت.
        </p>

        <Button onClick={handleResetForm} variant="outline" size="sm">
          طلب منتج آخر
        </Button>
      </div>
    )
  }

  return (
    <div
      id="order"
      dir="rtl"
      className={`scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm transition-all text-right ${className}`}
    >
      {/* Form Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              استمارة تأكيد الطلب
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            املأ المعلومات أدناه لتأكيد طلبك مباشرة وسنتصل بك للتوصيل
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="size-3.5" />
          <span>الدفع عند الاستلام</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Variant Selection if product has variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-muted/20">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>الموديل / الخيار المطلوب:</span>
              </span>
              {activeVariant && (
                <span className="text-[11px] font-bold text-primary">
                  {activeVariant.title}
                </span>
              )}
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {product.variants.map((v) => {
                const isSelected = activeVariant?.id === v.id
                const isOutOfStock = v.inStock === false

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleVariantSelect(v)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-right transition-all text-xs ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary font-bold text-foreground'
                        : isOutOfStock
                          ? 'border-border/60 bg-muted/10 opacity-50 cursor-not-allowed text-muted-foreground'
                          : 'border-border bg-card hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          isSelected
                            ? 'bg-primary'
                            : isOutOfStock
                              ? 'bg-muted-foreground'
                              : 'bg-border'
                        }`}
                      />
                      <span className="truncate">{v.title}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 mr-2">
                      {v.price && (
                        <span className="font-semibold text-primary text-[11px]">
                          {v.price}
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="text-[10px] text-destructive font-medium">
                          (نفد)
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {/* Full Name & Phone Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="fullName"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <User className="size-3.5 text-muted-foreground" />
              <span>
                الاسم واللقب <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="fullName"
              placeholder="مثال: محمد بن علي"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              className="h-10 text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="phone"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Phone className="size-3.5 text-muted-foreground" />
              <span>
                رقم الهاتف <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="مثال: 0555 12 34 56"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              className="h-10 text-right"
              dir="ltr"
            />
          </div>
        </div>

        {/* Wilaya & Commune */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="wilaya"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <MapPin className="size-3.5 text-muted-foreground" />
              <span>
                الولاية <span className="text-destructive">*</span>
              </span>
            </Label>
            <div className="relative">
              <select
                id="wilaya"
                value={selectedWilaya}
                onChange={handleWilayaChange}
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 text-foreground text-right"
                dir="rtl"
              >
                <option value="" disabled>
                  -- اختر الولاية --
                </option>
                {wilayas.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.ar_label || `${w.code} - ${w.ar_name}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="commune"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>
                البلدية <span className="text-destructive">*</span>
              </span>
            </Label>
            <div className="relative">
              <select
                id="commune"
                value={selectedCommune}
                onChange={(e) => setSelectedCommune(e.target.value)}
                required
                disabled={!selectedWilaya}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 text-foreground text-right"
                dir="rtl"
              >
                <option value="" disabled>
                  {selectedWilaya
                    ? '-- اختر البلدية --'
                    : '-- يرجى اختيار الولاية أولاً --'}
                </option>
                {availableCommunes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.ar_name ? `${c.ar_name} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Delivery Type */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Truck className="size-3.5 text-muted-foreground" />
            <span>
              نوع التوصيل <span className="text-destructive">*</span>
            </span>
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Home Delivery */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                deliveryType === 'home delivery'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="deliveryType"
                value="home delivery"
                checked={deliveryType === 'home delivery'}
                onChange={() => setDeliveryType('home delivery')}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Truck className="size-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      توصيل إلى باب المنزل
                    </span>
                  </div>
                  {isFreeDelivery ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      مجاني (0 دج)
                    </span>
                  ) : selectedWilaya ? (
                    <span className="text-xs font-bold text-primary">
                      + {wilayaRates.homePrice} دج
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      {wilayaRates.homePrice} دج
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  توصيل سريع ومباشر إلى عنوانك الشخصي أو مقر العمل
                </p>
              </div>
            </label>

            {/* Stop Desk */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                deliveryType === 'stopdesk'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="deliveryType"
                value="stopdesk"
                checked={deliveryType === 'stopdesk'}
                onChange={() => setDeliveryType('stopdesk')}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Store className="size-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      استلام من المكتب (Stop Desk)
                    </span>
                  </div>
                  {isFreeDelivery ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      مجاني (0 دج)
                    </span>
                  ) : selectedWilaya ? (
                    <span className="text-xs font-bold text-primary">
                      + {wilayaRates.stopdeskPrice} دج
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      {wilayaRates.stopdeskPrice} دج
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  استلم طردك من أقرب نقطة توزيع أو مكتب توصيل في ولايتك
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Quantity & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5 sm:col-span-1">
            <Label className="text-xs font-semibold">الكمية</Label>
            <div className="flex items-center border border-input rounded-md h-10 bg-background overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 h-full hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-sm transition-colors"
                title="تقليل الكمية"
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-sm text-foreground">
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 h-full hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-sm transition-colors"
                title="زيادة الكمية"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes" className="text-xs font-semibold">
              ملاحظات أو تعليمات إضافية (اختياري)
            </Label>
            <Input
              id="notes"
              placeholder="مثال: الاتصال قبل الوصول، توقيت التسليم المفضل..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Order Summary & Pricing box */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>المنتج المحدد:</span>
            <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {product.title}
            </span>
          </div>

          {activeVariant && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>الخيار / الموديل:</span>
              <span className="font-bold text-foreground">
                {activeVariant.title}
              </span>
            </div>
          )}

          {effectivePrice && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>سعر الوحدة:</span>
              <span className="font-semibold text-foreground">
                {effectivePrice} دج
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>الكمية:</span>
            <span className="font-semibold text-foreground">x{quantity}</span>
          </div>

          {subtotalDisplay && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span>المجموع الفرعي (المنتج):</span>
              <span className="font-medium text-foreground">
                {subtotalDisplay}
              </span>
            </div>
          )}

          {/* Delivery Fee Line */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Truck className="size-3 text-primary" />
              <span>
                رسوم التوصيل ({deliveryType === 'home delivery' ? 'للمنزل' : 'Stop Desk'}):
              </span>
            </span>

            {isFreeDelivery ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                توصيل مجاني (0 دج)
              </span>
            ) : selectedWilaya ? (
              <span className="font-bold text-foreground">
                + {effectiveDeliveryFee} دج
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                (اختر الولاية لتحديد السعر)
              </span>
            )}
          </div>

          <div className="border-t border-border/60 pt-2 mt-2 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-foreground block">
                المجموع الإجمالي:
              </span>
              <span className="text-[10px] text-muted-foreground">
                (شامل التوصيل عند الاستلام)
              </span>
            </div>
            <span className="text-lg font-black text-primary">
              {totalDisplay || 'يحدد عند التأكيد'}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-bold shadow-md gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span>جارٍ إرسال الطلب...</span>
            </>
          ) : (
            <>
              <Truck className="size-5" />
              <span>
                تأكيد الطلب الآن {totalDisplay ? `• ${totalDisplay}` : ''}
              </span>
            </>
          )}
        </Button>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>الدفع نقداً عند الاستلام</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            <span>توصيل سريع لكافة الولايات (58 ولاية)</span>
          </div>
        </div>
      </form>
    </div>
  )
}
