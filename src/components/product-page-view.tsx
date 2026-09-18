import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Maximize2,
  X,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react'
import type { Product } from '#/lib/types'
import { Button } from './ui/button'
import { ThemeToggle } from './theme-toggle'

interface ProductPageViewProps {
  product: Product
}

export function ProductPageView({ product }: ProductPageViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const images = product.images || []
  const currentImage = images[selectedImageIndex] || images[0]

  React.useEffect(() => {
    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0)
    }
  }, [images.length, selectedImageIndex])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') setLightboxOpen(false)
        if (e.key === 'ArrowRight' && images.length > 1) {
          setSelectedImageIndex((prev) => (prev + 1) % images.length)
        }
        if (e.key === 'ArrowLeft' && images.length > 1) {
          setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, images.length])

  const nextImage = () => {
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Dashboard</span>
          </a>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              size="xs"
              variant="outline"
              onClick={handleShare}
              className="text-xs gap-1.5 h-8"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5" />}
              {copied ? 'Copied' : 'Share'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-4/3 sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-muted/30 border border-border group">
            {currentImage ? (
              <img
                key={currentImage.url}
                src={currentImage.url}
                alt={product.title}
                className="h-full w-full object-contain bg-muted/10"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="size-10 opacity-30 mb-2" />
                <p className="text-xs">No images available</p>
              </div>
            )}

            {currentImage && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 hover:bg-background text-foreground backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-xs"
                title="Enlarge"
              >
                <Maximize2 className="size-4" />
              </button>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-md"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-md"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            {images.length > 0 && (
              <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-xs border border-border/60 text-[11px] font-medium">
                {selectedImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => {
                const isSelected = idx === selectedImageIndex
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative shrink-0 size-16 sm:size-20 rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 scale-105'
                        : 'border-border/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.name || `Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold px-1 rounded bg-black/60 text-white leading-tight">
                      #{idx + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Product Details: Title & Description */}
        <div className="space-y-4 pt-2 border-t border-border">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {product.title}
          </h1>

          <div className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
            {product.description || 'No description provided.'}
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10"
            >
              <X className="size-6" />
            </button>

            <img
              src={currentImage.url}
              alt={product.title}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <div
                className="mt-4 flex items-center gap-4 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={prevImage}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="text-xs">
                  {selectedImageIndex + 1} of {images.length}
                </span>
                <button
                  type="button"
                  onClick={nextImage}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30"
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
