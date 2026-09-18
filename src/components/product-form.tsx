import * as React from 'react'
import {
  Lock,
  Unlock,
  Save,
  RotateCcw,
  Check,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import type { Product, ProductImage } from '#/lib/types'
import { slugify } from '#/lib/types'
import { ImageManager } from './image-manager'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'

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
  const [description, setDescription] = React.useState(initialProduct?.description || '')
  const [images, setImages] = React.useState<ProductImage[]>(initialProduct?.images || [])
  const [isSaving, setIsSaving] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [savedSlug, setSavedSlug] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (initialProduct) {
      setTitle(initialProduct.title)
      setSlug(initialProduct.slug)
      setIsSlugLocked(false)
      setDescription(initialProduct.description)
      setImages(initialProduct.images)
    } else {
      setTitle('')
      setSlug('')
      setIsSlugLocked(true)
      setDescription('')
      setImages([])
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
        p.id !== (initialProduct?.id || '')
    )
    if (collision) {
      setValidationError(`The slug "${slug}" is already in use by "${collision.title}".`)
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
        published: true,
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
    setValidationError(null)
    if (onCancel) onCancel()
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {initialProduct ? 'Edit Product' : 'Create Product Page'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload multiple images in order, enter title, description, and slug.
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

      {/* 2. Title & Slug Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="prod-title" className="text-xs font-semibold">
            Title *
          </Label>
          <Input
            id="prod-title"
            placeholder="e.g. Leather Travel Bag"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="prod-slug" className="text-xs font-semibold flex items-center gap-1">
              Slug *
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                title={isSlugLocked ? 'Auto-sync with title (click to edit manually)' : 'Custom slug (click to auto-sync)'}
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
              placeholder="leather-travel-bag"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              disabled={isSlugLocked}
              className="pl-8 h-9 text-xs font-mono disabled:opacity-75"
            />
          </div>
        </div>
      </div>

      {/* 3. Description */}
      <div className="space-y-1.5">
        <Label htmlFor="prod-description" className="text-xs font-semibold">
          Description
        </Label>
        <Textarea
          id="prod-description"
          placeholder="Write product details, specs, and information..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="text-xs leading-relaxed"
        />
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
            {isSaving ? 'Saving...' : initialProduct ? 'Update' : 'Save Product'}
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
