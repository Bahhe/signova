import * as React from 'react'
import {
  Lock,
  Unlock,
  Save,
  RotateCcw,
  Check,
  ExternalLink,
  ArrowRight,
  DollarSign,
  Tag,
  Plus,
  X,
  ShoppingCart,
  Globe,
  EyeOff,
  CheckCircle2,
  Layers,
  Sparkles,
  Trash2,
  Image as ImageIcon,
  Truck,
} from 'lucide-react'
import type {
  Product,
  ProductImage,
  ProductVariant,
  ProductVariantOption,
} from '#/lib/types'
import { slugify } from '#/lib/types'
import { ImageManager } from './image-manager'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Switch } from './ui/switch'

interface ProductFormProps {
  initialProduct?: Product | null
  existingProducts?: Product[]
  onSave: (product: Product, andView?: boolean) => Promise<void>
  onCancel?: () => void
}

export function ProductForm({
  initialProduct,
  existingProducts = [],
  onSave,
  onCancel,
}: ProductFormProps) {
  const [title, setTitle] = React.useState(initialProduct?.title || '')
  const [slug, setSlug] = React.useState(initialProduct?.slug || '')
  const [isSlugLocked, setIsSlugLocked] = React.useState(!initialProduct)
  const [description, setDescription] = React.useState(
    initialProduct?.description || '',
  )
  const [images, setImages] = React.useState<ProductImage[]>(
    initialProduct?.images || [],
  )
  const [price, setPrice] = React.useState(initialProduct?.price || '')
  const [category, setCategory] = React.useState(initialProduct?.category || '')
  const [badge, setBadge] = React.useState(initialProduct?.badge || '')
  const [features, setFeatures] = React.useState<string[]>(
    initialProduct?.features || [],
  )
  const [newFeature, setNewFeature] = React.useState('')
  const [ctaText, setCtaText] = React.useState(initialProduct?.ctaText || '')
  const [published, setPublished] = React.useState<boolean>(
    initialProduct ? initialProduct.published !== false : true,
  )
  const [freeDelivery, setFreeDelivery] = React.useState<boolean>(
    initialProduct ? Boolean(initialProduct.freeDelivery) : false,
  )

  // Product Variants state
  const [hasVariants, setHasVariants] = React.useState<boolean>(
    Boolean(initialProduct?.variants && initialProduct.variants.length > 0),
  )
  const [variantOptions, setVariantOptions] = React.useState<
    ProductVariantOption[]
  >(initialProduct?.variantOptions || [])
  const [variants, setVariants] = React.useState<ProductVariant[]>(
    initialProduct?.variants || [],
  )
  const [newOptionName, setNewOptionName] = React.useState('')
  const [newOptionValueInputs, setNewOptionValueInputs] = React.useState<
    Record<string, string | undefined>
  >({})
  const [activeImagePickerVariantId, setActiveImagePickerVariantId] =
    React.useState<string | null>(null)

  const [isSaving, setIsSaving] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )
  const [savedSlug, setSavedSlug] = React.useState<string | null>(null)

  // Derived suggested categories from existing products and defaults
  const suggestedCategories = React.useMemo(() => {
    const defaults = [
      'Workspace',
      'Gear',
      'Coffee',
      'Electronics',
      'Apparel',
      'Accessories',
      'Home',
    ]
    const fromExisting = existingProducts
      .map((p) => p.category)
      .filter(Boolean) as string[]
    return Array.from(new Set([...defaults, ...fromExisting]))
  }, [existingProducts])

  const suggestedBadges = [
    'Best Seller',
    'Staff Pick',
    'Limited Run',
    'New Arrival',
    'On Sale',
    'Featured',
  ]

  React.useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title || '')
      setSlug(initialProduct.slug || '')
      setIsSlugLocked(false)
      setDescription(initialProduct.description || '')
      setImages(initialProduct.images)
      setPrice(initialProduct.price || '')
      setCategory(initialProduct.category || '')
      setBadge(initialProduct.badge || '')
      setFeatures(initialProduct.features || [])
      setNewFeature('')
      setCtaText(initialProduct.ctaText || '')
      setPublished(initialProduct.published !== false)
      setFreeDelivery(Boolean(initialProduct.freeDelivery))
      setHasVariants(
        Boolean(initialProduct.variants && initialProduct.variants.length > 0),
      )
      setVariantOptions(initialProduct.variantOptions || [])
      setVariants(initialProduct.variants || [])
    } else {
      setTitle('')
      setSlug('')
      setIsSlugLocked(true)
      setDescription('')
      setImages([])
      setPrice('')
      setCategory('')
      setBadge('')
      setFeatures([])
      setNewFeature('')
      setCtaText('')
      setPublished(true)
      setFreeDelivery(false)
      setHasVariants(false)
      setVariantOptions([])
      setVariants([])
    }
  }, [initialProduct])

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (isSlugLocked) {
      setSlug(slugify(val))
    }
    setValidationError(null)
  }

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val))
    setValidationError(null)
  }

  const handleAddFeature = () => {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    if (!features.includes(trimmed)) {
      setFeatures([...features, trimmed])
    }
    setNewFeature('')
  }

  const handleRemoveFeature = (idxToRemove: number) => {
    setFeatures(features.filter((_, idx) => idx !== idxToRemove))
  }

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddFeature()
    }
  }

  // Variant helper functions & handlers
  const suggestedOptionNames = [
    'اللون',
    'المقاس',
    'السعة',
    'النوع',
    'الموديل',
    'Color',
    'Size',
  ]

  const handleAddOptionGroup = (optName?: string) => {
    const nameToAdd = (optName || newOptionName).trim()
    if (!nameToAdd) return
    const id = `opt-${Date.now()}`
    setVariantOptions((prev) => [...prev, { id, name: nameToAdd, values: [] }])
    setNewOptionName('')
  }

  const handleRemoveOptionGroup = (optId: string) => {
    setVariantOptions((prev) => prev.filter((o) => o.id !== optId))
  }

  const handleAddOptionValue = (optId: string) => {
    const rawVal = newOptionValueInputs[optId]?.trim()
    if (!rawVal) return
    setVariantOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optId && !opt.values.includes(rawVal)) {
          return { ...opt, values: [...opt.values, rawVal] }
        }
        return opt
      }),
    )
    setNewOptionValueInputs((prev) => ({ ...prev, [optId]: '' }))
  }

  const handleRemoveOptionValue = (optId: string, valIndex: number) => {
    setVariantOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optId) {
          return {
            ...opt,
            values: opt.values.filter((_, idx) => idx !== valIndex),
          }
        }
        return opt
      }),
    )
  }

  const handleGenerateVariants = () => {
    const active = variantOptions.filter(
      (o) => o.name.trim() && o.values.length > 0,
    )
    if (active.length === 0) return

    let combinations: {
      title: string
      options: Record<string, string>
    }[] = [{ title: '', options: {} }]

    for (const opt of active) {
      const nextCombos: typeof combinations = []
      for (const current of combinations) {
        for (const val of opt.values) {
          nextCombos.push({
            title: current.title ? `${current.title} / ${val}` : val,
            options: { ...current.options, [opt.name.trim()]: val },
          })
        }
      }
      combinations = nextCombos
    }

    const generated: ProductVariant[] = combinations.map((combo, idx) => {
      const existing = variants.find(
        (v) => v.title.toLowerCase() === combo.title.toLowerCase(),
      )
      if (existing) {
        return {
          ...existing,
          options: combo.options,
        }
      }
      return {
        id: `var-${Date.now()}-${idx}`,
        title: combo.title,
        price: price || undefined,
        inStock: true,
        options: combo.options,
      }
    })

    setVariants(generated)
  }

  const handleAddCustomVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      title: `Variant ${variants.length + 1}`,
      price: price || undefined,
      inStock: true,
    }
    setVariants((prev) => [...prev, newVar])
  }

  const handleUpdateVariant = (
    variantId: string,
    updates: Partial<ProductVariant>,
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, ...updates } : v)),
    )
  }

  const handleDeleteVariant = (variantId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== variantId))
  }

  const validate = (): boolean => {
    if (!title.trim()) {
      setValidationError('Please enter a product title.')
      return false
    }
    if (!slug.trim()) {
      setValidationError('Please enter a slug.')
      return false
    }

    const collision = existingProducts.find(
      (p) =>
        p.slug.toLowerCase() === slug.toLowerCase() &&
        p.id !== (initialProduct?.id || ''),
    )
    if (collision) {
      setValidationError(
        `The slug "${slug}" is already in use by "${collision.title}".`,
      )
      return false
    }

    if (images.some((img) => img.isUploading)) {
      setValidationError(
        'Please wait for images to finish uploading before saving.',
      )
      return false
    }

    if (images.some((img) => img.error)) {
      setValidationError(
        'One or more images failed to upload to storage. Please retry or remove them before saving.',
      )
      return false
    }

    if (hasVariants) {
      if (variants.length === 0) {
        setValidationError(
          'Please configure at least one variant or disable the variants toggle.',
        )
        return false
      }
      if (variants.some((v) => !v.title.trim())) {
        setValidationError('All product variants must have a title or name.')
        return false
      }
    }

    setValidationError(null)
    return true
  }

  const performSave = async (andView = false) => {
    if (!validate()) return

    setIsSaving(true)
    try {
      const product: Product = {
        id: initialProduct?.id || `prod-${Date.now()}`,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        images,
        price: price.trim() || undefined,
        category: category.trim() || undefined,
        badge: badge.trim() || undefined,
        features: features.map((f) => f.trim()).filter(Boolean),
        variants: hasVariants ? variants : [],
        variantOptions: hasVariants ? variantOptions : [],
        ctaText: ctaText.trim() || undefined,
        ctaUrl: initialProduct?.ctaUrl || '#order',
        published,
        freeDelivery,
        createdAt: initialProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await onSave(product, andView)
      setSavedSlug(product.slug)
      setTimeout(() => setSavedSlug(null), 5000)

      if (!initialProduct && !andView) {
        setTitle('')
        setSlug('')
        setIsSlugLocked(true)
        setDescription('')
        setImages([])
        setPrice('')
        setCategory('')
        setBadge('')
        setFeatures([])
        setNewFeature('')
        setCtaText('')
        setPublished(true)
        setFreeDelivery(false)
        setHasVariants(false)
        setVariantOptions([])
        setVariants([])
      }
    } catch (err: any) {
      console.error(err)
      setValidationError(err.message || 'Failed to save product.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setTitle('')
    setSlug('')
    setIsSlugLocked(true)
    setDescription('')
    setImages([])
    setPrice('')
    setCategory('')
    setBadge('')
    setFeatures([])
    setNewFeature('')
    setCtaText('')
    setPublished(true)
    setFreeDelivery(false)
    setHasVariants(false)
    setVariantOptions([])
    setVariants([])
    setValidationError(null)
    if (onCancel) onCancel()
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {initialProduct ? 'Edit Product' : 'Create Product Page'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure product imagery, title, pricing, category, key features,
            and call to action.
          </p>
        </div>

        {initialProduct && onCancel && (
          <Button type="button" variant="outline" size="xs" onClick={onCancel}>
            Cancel Edit
          </Button>
        )}
      </div>

      {validationError && (
        <div className="p-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          {validationError}
        </div>
      )}

      {savedSlug && (
        <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Check className="size-4 text-emerald-600" />
            Product saved to PostgreSQL successfully!
          </span>
          <a
            href={`/p/${savedSlug}`}
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold flex items-center gap-1 hover:text-emerald-800 dark:hover:text-emerald-200"
          >
            Open Page /p/{savedSlug} <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      {/* 1. Images by Order */}
      <ImageManager images={images} onChange={setImages} />

      {/* 2. Basic Info: Title & Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prod-title" className="text-xs font-semibold">
            Product Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="prod-title"
            placeholder="e.g. Aero Mechanical Keyboard"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="prod-slug"
              className="text-xs font-semibold flex items-center gap-1"
            >
              Slug <span className="text-destructive">*</span>
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                title={
                  isSlugLocked
                    ? 'Auto-sync with title (click to edit manually)'
                    : 'Custom slug (click to auto-sync)'
                }
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                {isSlugLocked ? (
                  <Lock className="size-3 text-primary" />
                ) : (
                  <Unlock className="size-3 text-amber-500" />
                )}
              </button>
            </Label>
            <span className="text-[10px] text-muted-foreground font-mono">
              /p/{slug || '...'}
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-xs text-muted-foreground select-none font-mono">
              /p/
            </span>
            <Input
              id="prod-slug"
              placeholder="aero-mechanical-keyboard"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={isSlugLocked}
              className="pl-8 h-9 text-xs font-mono disabled:opacity-75"
            />
          </div>
        </div>
      </div>

      {/* 3. Pricing, Category & Badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Price */}
        <div className="space-y-1.5">
          <Label
            htmlFor="prod-price"
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <DollarSign className="size-3.5 text-emerald-600" />
            <span>Price</span>
          </Label>
          <Input
            id="prod-price"
            placeholder="e.g. $189.00 or €145"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label
            htmlFor="prod-category"
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <Tag className="size-3.5 text-primary" />
            <span>Category</span>
          </Label>
          <div className="relative">
            <Input
              id="prod-category"
              list="category-suggestions"
              placeholder="e.g. Workspace, Gear..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 text-xs"
            />
            <datalist id="category-suggestions">
              {suggestedCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          {/* Quick select category chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {suggestedCategories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  category === cat
                    ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Badge / Tag */}
        <div className="space-y-1.5">
          <Label
            htmlFor="prod-badge"
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <span>Badge / Label</span>
          </Label>
          <div className="relative">
            <Input
              id="prod-badge"
              list="badge-suggestions"
              placeholder="e.g. Best Seller, Staff Pick"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="h-9 text-xs"
            />
            <datalist id="badge-suggestions">
              {suggestedBadges.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          {/* Quick select badge chips */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {suggestedBadges.slice(0, 4).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBadge(b)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  badge === b
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Free Delivery Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 transition-all">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <Label
              htmlFor="prod-free-delivery"
              className="text-xs font-bold text-foreground cursor-pointer"
            >
              توصيل مجاني لهذا المنتج (Free Delivery)
            </Label>
            {freeDelivery && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                0 دج
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            عند تفعيل هذا الخيار، سيكون التوصيل مجانياً (0 دج للمنزل واستلام المكتب) لهذا المنتج عند الطلب.
          </p>
        </div>
        <Switch
          id="prod-free-delivery"
          checked={freeDelivery}
          onCheckedChange={setFreeDelivery}
        />
      </div>

      {/* 4. Description */}
      <div className="space-y-1.5">
        <Label htmlFor="prod-description" className="text-xs font-semibold">
          Description
        </Label>
        <Textarea
          id="prod-description"
          placeholder="Write product details, specs, story, and information..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="text-xs leading-relaxed"
        />
      </div>

      {/* 5. Key Features & Highlights */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>Key Features & Specifications</span>
          </Label>
          <span className="text-[11px] text-muted-foreground">
            {features.length} {features.length === 1 ? 'feature' : 'features'}{' '}
            added
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="e.g. CNC anodized 6063 aluminum chassis (Press Enter to add)"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={handleFeatureKeyDown}
            className="h-9 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddFeature}
            disabled={!newFeature.trim()}
            className="shrink-0 h-9 gap-1 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Add</span>
          </Button>
        </div>

        {features.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-muted/20 text-xs text-foreground"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span className="truncate">{feature}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="opacity-60 hover:opacity-100 hover:text-destructive text-muted-foreground p-0.5 rounded transition-opacity"
                  title="Remove feature"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            No features added yet. Add bullet highlights to display on the
            product showcase.
          </p>
        )}
      </div>

      {/* 6. Product Variants & Options (خيارات ومتغيرات المنتج) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/80">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <span>Product Variants & Options (خيارات ومتغيرات المنتج)</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Enable this if this product has multiple colors, sizes, models, or
              bundles with custom pricing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {hasVariants ? 'Enabled' : 'Disabled'}
            </span>
            <Switch
              id="prod-has-variants"
              checked={hasVariants}
              onCheckedChange={(checked) => {
                setHasVariants(checked)
                if (checked && variants.length === 0) {
                  // Add default option group to help user get started quickly
                  if (variantOptions.length === 0) {
                    setVariantOptions([
                      {
                        id: `opt-${Date.now()}`,
                        name: 'اللون',
                        values: [],
                      },
                    ])
                  }
                }
              }}
            />
          </div>
        </div>

        {hasVariants && (
          <div className="space-y-6 pt-1">
            {/* Step A: Option Types & Values Builder */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/80 bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" />
                    <span>Option Attributes (مثل اللون، المقاس، النوع)</span>
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Add option groups like Color or Size, then enter available
                    values.
                  </p>
                </div>

                {/* Quick Add Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium mr-1">
                    Quick suggestions:
                  </span>
                  {suggestedOptionNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleAddOptionGroup(name)}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-background hover:bg-muted text-foreground transition-colors"
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option Groups List */}
              <div className="space-y-3 pt-1">
                {variantOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="p-3 rounded-lg border border-border bg-background space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <Label className="text-[11px] font-semibold shrink-0 text-muted-foreground">
                          Option Name:
                        </Label>
                        <Input
                          placeholder="e.g. اللون (Color) or المقاس (Size)"
                          value={opt.name}
                          onChange={(e) =>
                            setVariantOptions((prev) =>
                              prev.map((o) =>
                                o.id === opt.id
                                  ? { ...o, name: e.target.value }
                                  : o,
                              ),
                            )
                          }
                          className="h-8 text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOptionGroup(opt.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                        title="Delete Option Group"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Values Pills & Input */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground font-medium">
                        Values (القيم المتوفرة):
                      </Label>
                      <div className="flex flex-wrap items-center gap-1.5 min-h-7">
                        {opt.values.map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium"
                          >
                            <span>{val}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveOptionValue(opt.id, vIdx)
                              }
                              className="hover:text-destructive hover:scale-110 transition-all ml-0.5"
                              title="Remove value"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}

                        <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                          <Input
                            placeholder="Add value (e.g. أسود, S, M...) and press Enter"
                            value={newOptionValueInputs[opt.id] || ''}
                            onChange={(e) =>
                              setNewOptionValueInputs((prev) => ({
                                ...prev,
                                [opt.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddOptionValue(opt.id)
                              }
                            }}
                            className="h-7 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            onClick={() => handleAddOptionValue(opt.id)}
                            disabled={!newOptionValueInputs[opt.id]?.trim()}
                            className="h-7 text-xs px-2 shrink-0"
                          >
                            <Plus className="size-3 mr-0.5" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new option input */}
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="New custom option name (e.g. نوع القماش, السعة...)"
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddOptionGroup()
                      }
                    }}
                    className="h-8 text-xs max-w-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddOptionGroup()}
                    disabled={!newOptionName.trim()}
                    className="h-8 text-xs gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Option</span>
                  </Button>
                </div>
              </div>

              {/* Generate Variants Action Button */}
              {variantOptions.some((o) => o.values.length > 0) && (
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    Automatically create variants by combining all option
                    values.
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleGenerateVariants}
                    className="h-8 text-xs gap-1.5 bg-primary font-semibold shadow-xs"
                  >
                    <Sparkles className="size-3.5" />
                    <span>
                      Generate Variants from Options (توليد التشكيلات)
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* Step B: Configured Variants List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Configured Variants ({variants.length})</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Set variant specific prices, stock availability, and
                    associated photos.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleAddCustomVariant}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="size-3" />
                  <span>+ Add Custom Variant</span>
                </Button>
              </div>

              {variants.length > 0 ? (
                <div className="space-y-2.5">
                  {variants.map((v) => {
                    const variantImg = v.imageId
                      ? images.find((img) => img.id === v.imageId)
                      : v.imageUrl
                        ? { url: v.imageUrl, name: 'Variant Photo' }
                        : null

                    return (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Image & Title */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Image Picker Trigger */}
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveImagePickerVariantId(
                                    activeImagePickerVariantId === v.id
                                      ? null
                                      : v.id,
                                  )
                                }
                                className={`size-11 rounded-lg border flex items-center justify-center overflow-hidden transition-colors ${
                                  variantImg
                                    ? 'border-primary/40 bg-muted/40'
                                    : 'border-dashed border-border hover:border-foreground/40 bg-muted/20'
                                }`}
                                title="Click to assign photo to this variant"
                              >
                                {variantImg ? (
                                  <img
                                    src={variantImg.url}
                                    alt={v.title}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="size-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>

                            {/* Title input */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <Input
                                value={v.title}
                                onChange={(e) =>
                                  handleUpdateVariant(v.id, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Variant title (e.g. Lunar Grey / Linear)"
                                className="h-8 text-xs font-semibold"
                              />
                              {v.options &&
                                Object.keys(v.options).length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(v.options).map(
                                      ([k, val]) => (
                                        <span
                                          key={k}
                                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-medium"
                                        >
                                          {k}: {val}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Price Override & Stock & Actions */}
                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                            {/* Price */}
                            <div className="space-y-0.5">
                              <div className="relative">
                                <DollarSign className="size-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
                                <Input
                                  value={v.price || ''}
                                  onChange={(e) =>
                                    handleUpdateVariant(v.id, {
                                      price: e.target.value,
                                    })
                                  }
                                  placeholder={price || 'Base price'}
                                  className="h-8 pl-6 w-28 sm:w-32 text-xs"
                                  title="Custom price override for this variant"
                                />
                              </div>
                            </div>

                            {/* In Stock toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateVariant(v.id, {
                                  inStock: v.inStock === false ? true : false,
                                })
                              }
                              className={`h-8 px-2.5 rounded-md text-[11px] font-semibold border transition-colors ${
                                v.inStock !== false
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-destructive/10 text-destructive border-destructive/30'
                              }`}
                            >
                              {v.inStock !== false
                                ? 'In Stock'
                                : 'Out of Stock'}
                            </button>

                            {/* Delete Variant */}
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v.id)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete variant"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Image Selection Popover/Strip */}
                        {activeImagePickerVariantId === v.id && (
                          <div className="p-3 rounded-lg border border-border/80 bg-muted/30 space-y-2 animate-in fade-in-50 duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-foreground">
                                Select Photo for "{v.title}":
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() =>
                                  setActiveImagePickerVariantId(null)
                                }
                                className="h-6 text-[10px]"
                              >
                                Close
                              </Button>
                            </div>

                            {images.length > 0 ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                {/* Option to clear photo */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateVariant(v.id, {
                                      imageId: undefined,
                                      imageUrl: undefined,
                                    })
                                    setActiveImagePickerVariantId(null)
                                  }}
                                  className={`size-14 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-[9px] text-muted-foreground hover:border-destructive/60 hover:text-destructive transition-colors ${
                                    !v.imageId && !v.imageUrl
                                      ? 'border-primary bg-primary/5 text-primary'
                                      : 'border-border'
                                  }`}
                                >
                                  No Photo
                                </button>

                                {images.map((img, imgIdx) => {
                                  const isSelected =
                                    v.imageId === img.id ||
                                    v.imageUrl === img.url

                                  return (
                                    <button
                                      key={img.id || imgIdx}
                                      type="button"
                                      onClick={() => {
                                        handleUpdateVariant(v.id, {
                                          imageId: img.id,
                                          imageUrl: img.url,
                                        })
                                        setActiveImagePickerVariantId(null)
                                      }}
                                      className={`relative size-14 rounded-lg overflow-hidden border-2 transition-all ${
                                        isSelected
                                          ? 'border-primary ring-2 ring-primary/30 scale-105'
                                          : 'border-border opacity-70 hover:opacity-100 hover:border-foreground/40'
                                      }`}
                                    >
                                      <img
                                        src={img.url}
                                        alt={img.name || `Photo ${imgIdx + 1}`}
                                        className="size-full object-cover"
                                      />
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                          <Check className="size-4 text-primary bg-background rounded-full p-0.5" />
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic">
                                No product images uploaded yet. Upload images in
                                the gallery above first to associate them with
                                variants.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/10 space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    No variants generated yet.
                  </p>
                  <p className="text-[11px] text-muted-foreground/80">
                    Add option attributes above and click "Generate Variants",
                    or click "+ Add Custom Variant" to add one manually.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Call to Action (CTA) & Visibility Settings */}
      <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <ShoppingCart className="size-3.5 text-primary" />
          <span>Call to Action & Visibility</span>
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="prod-cta-text" className="text-xs font-medium">
            CTA Button Label
          </Label>
          <Input
            id="prod-cta-text"
            placeholder="e.g. Order Now, Claim Yours, Buy on Amazon"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Published Toggle Switch */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-md ${published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}
            >
              {published ? (
                <Globe className="size-4" />
              ) : (
                <EyeOff className="size-4" />
              )}
            </div>
            <div>
              <Label
                htmlFor="prod-published"
                className="text-xs font-semibold cursor-pointer"
              >
                {published ? 'Published (Live)' : 'Draft (Hidden)'}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {published
                  ? 'Product is visible in the public showcase and accessible via URL.'
                  : 'Product is saved as draft and hidden from the public storefront.'}
              </p>
            </div>
          </div>
          <Switch
            id="prod-published"
            checked={published}
            onCheckedChange={setPublished}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground h-8"
        >
          <RotateCcw className="size-3 mr-1" />
          Clear
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving || images.some((img) => img.isUploading)}
            onClick={() => void performSave(false)}
            className="gap-1 text-xs h-8"
          >
            <Save className="size-3.5" />
            {isSaving
              ? 'Saving...'
              : images.some((img) => img.isUploading)
                ? 'Uploading images...'
                : initialProduct
                  ? 'Update'
                  : 'Save Product'}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isSaving || images.some((img) => img.isUploading)}
            onClick={() => void performSave(true)}
            className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <span>{isSaving ? 'Saving...' : 'Save & View Page'}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
