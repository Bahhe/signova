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
  AlertCircle,
  RotateCw,
  FileWarning,
} from 'lucide-react'
import type { ProductImage } from '#/lib/types'
import { optimizeImageFile } from '#/lib/image-helpers'
import { Button } from './ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { toast } from './ui/sonner'
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
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Cache File references for retry functionality
  const fileMapRef = React.useRef<Map<string, File>>(new Map())

  // Keep latest images in ref to avoid race conditions during async uploads
  const imagesRef = React.useRef(images)
  imagesRef.current = images

  // Upload a single file to /api/upload
  const uploadSingleFile = async (tempId: string, file: File) => {
    try {
      const { url: base64, name } = await optimizeImageFile(file)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64,
          filename: name,
          contentType: file.type,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(
          errJson.error || `Upload failed with status ${res.status}`,
        )
      }

      const uploaded = (await res.json()) as ProductImage

      // Success: update the item in the list
      const updated = imagesRef.current.map((img) =>
        img.id === tempId
          ? {
              id: uploaded.id,
              url: uploaded.url,
              name: uploaded.name || file.name,
              size: uploaded.size || file.size,
              isUploading: false,
              error: undefined,
            }
          : img,
      )
      fileMapRef.current.delete(tempId)
      onChange(updated)
    } catch (err: any) {
      console.error('[SeaweedFS Upload Error]', err)
      const errorMsg =
        err.name === 'AbortError'
          ? 'Upload timed out. Storage server is unresponsive.'
          : err.message || 'Failed to upload image'

      setUploadError(
        `Failed to upload '${file.name}' to storage: ${errorMsg}. Please verify your SeaweedFS or S3 endpoint configuration.`,
      )

      // Mark the specific image item with error (DO NOT fallback to raw base64!)
      const updated = imagesRef.current.map((img) =>
        img.id === tempId
          ? {
              ...img,
              isUploading: false,
              error: errorMsg,
            }
          : img,
      )
      onChange(updated)
    }
  }

  // Handle newly selected or dropped files
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith('image/'),
    )
    if (fileArray.length === 0) return

    setUploadError(null)

    // 1. Instantly create optimistic preview items with object URLs (0ms delay)
    const newItems: { item: ProductImage; file: File }[] = fileArray.map(
      (file) => {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        fileMapRef.current.set(tempId, file)
        return {
          item: {
            id: tempId,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            isUploading: true,
          },
          file,
        }
      },
    )

    const nextImages = [...imagesRef.current, ...newItems.map((n) => n.item)]
    onChange(nextImages)

    // 2. Upload files concurrently in the background
    await Promise.allSettled(
      newItems.map(({ item, file }) => uploadSingleFile(item.id, file)),
    )

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Retry a failed upload
  const retryUpload = (id: string) => {
    const file = fileMapRef.current.get(id)
    if (!file) {
      // If we don't have the original File, check if the image has a data URL to re-upload
      const target = images.find((img) => img.id === id)
      if (target?.url.startsWith('data:image/')) {
        void uploadBase64Directly(id, target.url, target.name)
      }
      return
    }

    setUploadError(null)
    const updated = images.map((img) =>
      img.id === id ? { ...img, isUploading: true, error: undefined } : img,
    )
    onChange(updated)
    void uploadSingleFile(id, file)
  }

  // Re-upload a base64 image (e.g. from previously saved state)
  const uploadBase64Directly = async (
    id: string,
    base64Data: string,
    filename: string,
  ) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, isUploading: true, error: undefined } : img,
    )
    onChange(updated)
    setUploadError(null)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          filename,
        }),
      })

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(
          errJson.error || `Upload failed with status ${res.status}`,
        )
      }

      const uploaded = (await res.json()) as ProductImage
      const finalImages = imagesRef.current.map((img) =>
        img.id === id
          ? {
              id: uploaded.id,
              url: uploaded.url,
              name: uploaded.name || filename,
              size: uploaded.size,
              isUploading: false,
              error: undefined,
            }
          : img,
      )
      onChange(finalImages)
    } catch (err: any) {
      console.error('[Base64 Migration Error]', err)
      setUploadError(`Failed to migrate image to S3: ${err.message}`)
      const finalImages = imagesRef.current.map((img) =>
        img.id === id
          ? { ...img, isUploading: false, error: err.message }
          : img,
      )
      onChange(finalImages)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    // if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    void handleFiles(e.dataTransfer.files)
    // }
  }

  // HTML5 Drag-and-drop reordering between items
  const handleItemDragStart = (e: React.DragEvent, index: number) => {
    if (images[index]?.isUploading) return
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
    toast.success('Cover image updated.')
  }

  // Delete image
  const removeImage = (index: number) => {
    const target = images[index]
    // if (target) {
    fileMapRef.current.delete(target.id)
    // }
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
    toast.info('Image removed.')
  }

  const isAnyUploading = images.some((img) => img.isUploading)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Images ({images.length})
          </Label>
          {isAnyUploading && (
            <Badge
              variant="secondary"
              className="gap-1 text-[11px] py-0 px-1.5 animate-pulse"
            >
              <RotateCw className="size-3 animate-spin text-primary" />
              <span>Uploading to storage...</span>
            </Badge>
          )}
        </div>
        {images.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="text-xs text-destructive hover:bg-destructive/10 h-7"
              >
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all images?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all {images.length} images
                  from this product? You will need to upload or select them
                  again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    fileMapRef.current.clear()
                    onChange([])
                    toast.info('All images have been removed.')
                  }}
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Error Feedback Banner */}
      {uploadError && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Image Upload Error</p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {uploadError}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 text-destructive/70 hover:text-destructive rounded"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

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
              Click to select or drag images here
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag or use arrows to reorder.
            </p>
          </div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => {
            const isFirst = idx === 0
            const isLast = idx === images.length - 1
            const isBeingDragged = draggedIndex === idx
            const isDragTarget = dragOverIndex === idx
            const isUploading = Boolean(img.isUploading)
            const hasError = Boolean(img.error)
            const isBase64 = img.url.startsWith('data:image/')

            return (
              <div
                key={img.id}
                draggable={!isUploading}
                onDragStart={(e) => handleItemDragStart(e, idx)}
                onDragOver={(e) => handleItemDragOver(e, idx)}
                onDrop={(e) => handleItemDrop(e, idx)}
                onDragEnd={handleItemDragEnd}
                className={`group relative flex flex-col rounded-lg border overflow-hidden bg-card transition-all ${
                  isBeingDragged
                    ? 'opacity-40 scale-95 border-dashed border-primary'
                    : 'opacity-100'
                } ${
                  isDragTarget && !isBeingDragged
                    ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
                    : ''
                } ${
                  hasError
                    ? 'border-destructive ring-1 ring-destructive/40'
                    : isFirst
                      ? 'border-primary ring-1 ring-primary/40 shadow-xs'
                      : 'border-border'
                }`}
              >
                {/* Image Preview Container */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
                  <img
                    src={img.url}
                    alt={img.name || `Image #${idx + 1}`}
                    className={`h-full w-full object-cover transition-transform duration-300 ${
                      isUploading
                        ? 'opacity-60 blur-xs'
                        : 'group-hover:scale-105'
                    }`}
                    loading="lazy"
                  />

                  {/* Uploading Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                      <RotateCw className="size-5 text-primary animate-spin" />
                      <span className="text-[10px] font-semibold text-foreground">
                        Uploading to bucket...
                      </span>
                    </div>
                  )}

                  {/* Error Overlay */}
                  {hasError && !isUploading && (
                    <div className="absolute inset-0 bg-destructive/20 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                      <AlertCircle className="size-5 text-destructive" />
                      <span className="text-[10px] font-semibold text-destructive">
                        Upload Failed
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        onClick={() => retryUpload(img.id)}
                        className="h-6 text-[10px] px-2 gap-1 bg-background/90 hover:bg-background"
                      >
                        <RotateCw className="size-2.5" />
                        Retry
                      </Button>
                    </div>
                  )}

                  {/* Order & Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <div className="flex items-center gap-1">
                      {isFirst ? (
                        <Badge
                          variant="default"
                          className="text-[10px] font-bold shadow-xs bg-primary gap-1 px-1.5 py-0"
                        >
                          <Star className="size-2.5 fill-amber-400 text-amber-400" />
                          Cover
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-background/80 shadow-xs px-1.5 py-0"
                        >
                          #{idx + 1}
                        </Badge>
                      )}
                    </div>

                    {isBase64 && !isUploading && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-0.5"
                        title="Stored inline as base64 string instead of bucket"
                      >
                        <FileWarning className="size-2.5" /> Base64
                      </Badge>
                    )}
                  </div>

                  {/* Drag Handle & Zoom trigger */}
                  {!isUploading && (
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
                  )}
                </div>

                {/* Controls Toolbar */}
                <div className="p-1.5 flex items-center justify-between border-t border-border/60 bg-muted/20">
                  <button
                    type="button"
                    disabled={isFirst || isUploading}
                    onClick={() => moveImage(idx, 'prev')}
                    title="Move earlier"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <MoveLeft className="size-3.5" />
                  </button>

                  {isBase64 && !isUploading ? (
                    <button
                      type="button"
                      onClick={() =>
                        uploadBase64Directly(img.id, img.url, img.name)
                      }
                      className="text-[10px] px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium transition-colors"
                      title="Upload this base64 image into SeaweedFS bucket"
                    >
                      Send to S3
                    </button>
                  ) : !isFirst ? (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setAsCover(idx)}
                      className="text-[10px] px-1.5 py-0.5 rounded text-primary hover:bg-primary/10 font-medium transition-colors disabled:opacity-30"
                    >
                      Make Cover
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      #1
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={isLast || isUploading}
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
