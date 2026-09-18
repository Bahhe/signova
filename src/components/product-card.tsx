import * as React from 'react'
import { ExternalLink, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import type { Product } from '#/lib/types'
import { Button } from './ui/button'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const coverImage = product.images?.[0]
  const imageCount = product.images?.length || 0

  return (
    <div className="group flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors shadow-xs">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="relative size-14 sm:size-16 rounded-lg overflow-hidden bg-muted/30 shrink-0 border border-border/80">
          {coverImage ? (
            <img
              src={coverImage.url}
              alt={product.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
              <ImageIcon className="size-5" />
            </div>
          )}
          <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold px-1 rounded bg-black/70 text-white">
            {imageCount}
          </span>
        </div>

        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {product.description || 'No description'}
          </p>
          <a
            href={`/p/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
          >
            /p/{product.slug}
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onEdit(product)}
          className="h-8 px-2.5 text-xs gap-1"
        >
          <Edit2 className="size-3" />
          <span className="hidden sm:inline">Edit</span>
        </Button>

        <a
          href={`/p/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center h-8 px-2.5 text-xs rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors gap-1"
        >
          <span>View</span>
          <ExternalLink className="size-3" />
        </a>

        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            if (confirm(`Delete "${product.title}"?`)) {
              onDelete(product.id)
            }
          }}
          className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
