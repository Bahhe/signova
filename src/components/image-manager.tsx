import * as React from 'react'
import {
  UploadCloud,
  Trash2,
  MoveLeft,
  MoveRight,
  GripVertical,
  Star,
  Maximize2,
  X,
  Cloud,
} from 'lucide-react'
import type { ProductImage } from '#/lib/types'
import { optimizeImageFile } from '#/lib/image-helpers'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Label } from './ui/label'

interface ImageManagerProps {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Upload files to SeaweedFS
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) return

    setIsProcessing(true)
    try {
      const processed: ProductImage[] = []
      for (const file of fileArray) {
        const { url: base64, size, name } = await optimizeImageFile(file)
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: base64,
              filename: name,
              contentType: file.type,
            }),
          })
          if (res.ok) {
            const uploaded = (await res.json()) as ProductImage
            processed.push(uploaded)
          } else {
            throw new Error('Upload failed')
          }
        } catch (uploadErr) {
          console.warn('SeaweedFS upload error, using local fallback:', uploadErr)
          processed.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: base64,
            name,
            size,
          })
        }
      }
      onChange([...images, ...processed])
    } catch (err) {
      console.error('Error processing images:', err)
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files)
    }
  }

  // HTML5 Drag-and-drop reordering between items
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleItemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleItemDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = Array.from(images)
    const [moved] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, moved)

    onChange(updated)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleItemDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Move Left / Move Right
  const moveImage = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const updated = Array.from(images)
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    onChange(updated)
  }

  // Promote to Cover (#1)
  const setAsCover = (index: number) => {
    if (index === 0) return
    const updated = Array.from(images)
    const [moved] = updated.splice(index, 1)
    updated.unshift(moved)
    onChange(updated)
  }

  // Delete image
  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">
          Images ({images.length})
        </Label>
        {images.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange([])}
            className="text-xs text-destructive hover:bg-destructive/10 h-7"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDraggingOver
            ? 'border-primary bg-primary/5'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-muted/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files)
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <UploadCloud className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isProcessing ? 'Uploading to SeaweedFS...' : 'Click to select or drag images here'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Images are uploaded to SeaweedFS. Drag or use arrows to reorder.
            </p>
          </div>
        </div>
      </div>

      {/* Image Gallery Grid with Reordering */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => {
            const isFirst = idx === 0
            const isLast = idx === images.length - 1
            const isBeingDragged = draggedIndex === idx
            const isDragTarget = dragOverIndex === idx
            const isSeaweed =
              img.url.includes('signovas3') || img.url.includes('8333') || img.url.includes('8888')

            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => handleItemDragStart(e, idx)}
                onDragOver={(e) => handleItemDragOver(e, idx)}
                onDrop={(e) => handleItemDrop(e, idx)}
                onDragEnd={handleItemDragEnd}
                className={`group relative flex flex-col rounded-lg border overflow-hidden bg-card transition-all ${
                  isBeingDragged ? 'opacity-40 scale-95 border-dashed border-primary' : 'opacity-100'
                } ${
                  isDragTarget && !isBeingDragged
                    ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                    : ''
                } ${isFirst ? 'border-primary ring-1 ring-primary/40 shadow-xs' : 'border-border'}`}
              >
                {/* Image Preview */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
                  <img
                    src={img.url}
                    alt={img.name || `Image #${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Order Badge & Storage Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {isFirst ? (
                      <Badge variant="default" className="text-[10px] font-bold shadow-xs bg-primary gap-1 px-1.5 py-0">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        Cover
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-semibold bg-background/80 shadow-xs px-1.5 py-0">
                        #{idx + 1}
                      </Badge>
                    )}

                    {isSeaweed && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-background/80 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-0.5">
                        <Cloud className="size-2.5" /> S3
                      </Badge>
                    )}
                  </div>

                  {/* Drag Handle & Zoom trigger */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(img.url)}
                      title="Enlarge"
                      className="p-1 rounded-md bg-background/80 hover:bg-background text-foreground backdrop-blur-xs transition-colors"
                    >
                      <Maximize2 className="size-3" />
                    </button>
                    <div
                      className="p-1 rounded-md bg-background/80 text-muted-foreground backdrop-blur-xs cursor-grab active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical className="size-3" />
                    </div>
                  </div>
                </div>

                {/* Controls Toolbar */}
                <div className="p-1.5 flex items-center justify-between border-t border-border/60 bg-muted/20">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveImage(idx, 'prev')}
                    title="Move earlier"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <MoveLeft className="size-3.5" />
                  </button>

                  {!isFirst ? (
                    <button
                      type="button"
                      onClick={() => setAsCover(idx)}
                      className="text-[10px] px-1.5 py-0.5 rounded text-primary hover:bg-primary/10 font-medium transition-colors"
                    >
                      Make Cover
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">#1</span>
                  )}

                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveImage(idx, 'next')}
                    title="Move later"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <MoveRight className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    title="Remove"
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="size-6" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
