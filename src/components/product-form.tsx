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
} from 'lucide-react'
import type { Product, ProductImage } from '#/lib/types'
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
      setImages(initialProduct.images || [])
      setPrice(initialProduct.price || '')
      setCategory(initialProduct.category || '')
      setBadge(initialProduct.badge || '')
      setFeatures(initialProduct.features || [])
      setNewFeature('')
      setCtaText(initialProduct.ctaText || '')
      setPublished(initialProduct.published !== false)
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
        ctaText: ctaText.trim() || undefined,
        ctaUrl: initialProduct?.ctaUrl || '#order',
        published,
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

      {/* 6. Call to Action (CTA) & Visibility Settings */}
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
            disabled={isSaving}
            onClick={() => void performSave(false)}
            className="gap-1 text-xs h-8"
          >
            <Save className="size-3.5" />
            {isSaving
              ? 'Saving...'
              : initialProduct
                ? 'Update'
                : 'Save Product'}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isSaving}
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
