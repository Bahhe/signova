import * as React from 'react'
import {
  UploadCloud,
  Trash2,
  Globe,
  RotateCw,
  AlertCircle,
  Check,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { toast } from './ui/sonner'
import { optimizeImageFile, fileToDataUrl } from '#/lib/image-helpers'

interface BrandAssetUploaderProps {
  label: string
  description: string
  value: string
  onChange: (val: string) => void
  type: 'logo' | 'favicon'
  storeName?: string
  recommendation: string
  accept?: string
}

export function BrandAssetUploader({
  label,
  description,
  value,
  onChange,
  type,
  storeName = 'Signova',
  recommendation,
  accept = '.png,.jpg,.jpeg,.webp,.svg,.ico,image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon',
}: BrandAssetUploaderProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [showUrlInput, setShowUrlInput] = React.useState(false)
  const [directUrl, setDirectUrl] = React.useState(value)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setDirectUrl(value)
  }, [value])

  const handleProcessFile = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      // 1. Convert/optimize image
      let base64Data: string
      let filename = file.name

      // If ICO or SVG or small file, read directly to preserve precision
      if (
        file.name.endsWith('.ico') ||
        file.type === 'image/x-icon' ||
        file.type === 'image/vnd.microsoft.icon' ||
        file.type === 'image/svg+xml' ||
        file.size < 400 * 1024
      ) {
        base64Data = await fileToDataUrl(file)
      } else {
        const optimized = await optimizeImageFile(
          file,
          type === 'favicon' ? 256 : 1000,
          type === 'favicon' ? 256 : 500,
          0.92,
        ).catch(() =>
          fileToDataUrl(file).then((url) => ({
            url,
            size: file.size,
            name: file.name,
          })),
        )
        base64Data = optimized.url
        filename = optimized.name || file.name
      }

      // 2. Try uploading to server endpoint /api/upload
      let uploadedUrl: string | null = null
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            filename,
            contentType:
              file.type ||
              (filename.endsWith('.ico') ? 'image/x-icon' : 'image/png'),
          }),
        })

        if (res.ok) {
          const resData = await res.json().catch(() => null)
          if (resData?.url) {
            uploadedUrl = resData.url
          }
        }
      } catch (uploadErr) {
        console.warn(
          'Server upload to storage endpoint failed, using data URL fallback:',
          uploadErr,
        )
      }

      // 3. Set value (prefer uploaded storage URL, fallback to base64)
      const finalUrl = uploadedUrl || base64Data
      onChange(finalUrl)
      setDirectUrl(finalUrl)
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} updated successfully.`)
    } catch (err: any) {
      console.error('Failed to process asset file:', err)
      const errText = err?.message || 'Failed to process image file'
      setUploadError(errText)
      toast.error(errText)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
  }

  const handleClear = () => {
    onChange('')
    setDirectUrl('')
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.info(`${type === 'logo' ? 'Store logo' : 'Favicon'} removed.`)
  }

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (directUrl.trim()) {
      onChange(directUrl.trim())
      toast.success(
        `${type === 'logo' ? 'Logo' : 'Favicon'} URL applied successfully.`,
      )
    }
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-card/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{label}</span>
            {value ? (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                <Check className="size-2.5 mr-1 inline" /> Active
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground"
              >
                Not set
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] h-7 gap-1 text-muted-foreground hover:text-foreground"
          >
            <Globe className="size-3" />
            <span>{showUrlInput ? 'Hide URL' : 'Enter URL'}</span>
          </Button>

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClear}
              className="text-[11px] h-7 gap-1 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3" />
              <span>Remove</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Direct URL input accordion */}
      {showUrlInput && (
        <form
          onSubmit={handleApplyUrl}
          className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/60"
        >
          <Input
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder={
              type === 'logo'
                ? 'https://example.com/store-logo.png or /logo.png'
                : 'https://example.com/favicon.ico or /favicon.ico'
            }
            className="h-8 text-xs font-mono"
          />
          <Button
            type="submit"
            size="xs"
            className="h-8 shrink-0 text-xs font-semibold"
            disabled={!directUrl.trim() || directUrl === value}
          >
            Apply URL
          </Button>
        </form>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[10px] opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Preview and Upload Zone */}
      {value ? (
        <div className="space-y-3">
          {/* Main Visual Preview */}
          {type === 'logo' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Light background preview */}
              <div className="rounded-lg border border-border/70 p-3 bg-white text-zinc-900 flex flex-col items-center justify-center gap-2 min-h-[90px] relative group">
                <span className="absolute top-1.5 left-2 text-[10px] font-medium text-zinc-400">
                  Light Theme
                </span>
                <img
                  src={value}
                  alt="Store Logo Preview"
                  className="max-h-12 max-w-[180px] object-contain"
                />
              </div>

              {/* Dark background preview */}
              <div className="rounded-lg border border-border/70 p-3 bg-zinc-950 text-white flex flex-col items-center justify-center gap-2 min-h-[90px] relative group">
                <span className="absolute top-1.5 left-2 text-[10px] font-medium text-zinc-500">
                  Dark Theme
                </span>
                <img
                  src={value}
                  alt="Store Logo Preview Dark"
                  className="max-h-12 max-w-[180px] object-contain"
                />
              </div>
            </div>
          ) : (
            /* Favicon Browser Tab Mockup */
            <div className="p-3 rounded-xl border border-border/70 bg-muted/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Browser Tab Simulation
                </span>
                <span className="text-[10px] text-muted-foreground">
                  32x32 • 24x24 • 16x16
                </span>
              </div>

              {/* Browser chrome tab mockup */}
              <div className="bg-muted/60 rounded-lg p-2 flex items-center gap-3 border border-border/50">
                <div className="bg-card border border-border/80 rounded-t-md px-3 py-1.5 flex items-center gap-2 shadow-xs max-w-[240px] flex-1">
                  <img
                    src={value}
                    alt="Favicon Preview"
                    className="size-4 shrink-0 object-contain rounded-xs"
                  />
                  <span className="text-xs font-semibold truncate text-foreground">
                    {storeName} | Store
                  </span>
                  <span className="text-muted-foreground text-[10px] ml-auto">
                    ✕
                  </span>
                </div>

                {/* Additional size previews */}
                <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-[10px]">
                  <div
                    className="size-6 rounded-md bg-card border border-border flex items-center justify-center p-0.5"
                    title="24px icon"
                  >
                    <img
                      src={value}
                      alt="24px"
                      className="size-4 object-contain"
                    />
                  </div>
                  <div
                    className="size-5 rounded bg-card border border-border flex items-center justify-center p-0.5"
                    title="16px icon"
                  >
                    <img
                      src={value}
                      alt="16px"
                      className="size-3 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions toolbar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-7 text-xs gap-1.5"
              >
                {isUploading ? (
                  <RotateCw className="size-3 animate-spin" />
                ) : (
                  <UploadCloud className="size-3" />
                )}
                <span>Change Image</span>
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-right truncate">
              {recommendation}
            </p>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-border/80 hover:border-primary/50 hover:bg-muted/40 bg-card/30'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              {isUploading ? (
                <RotateCw className="size-5 animate-spin" />
              ) : (
                <UploadCloud className="size-5" />
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground">
                {isUploading
                  ? 'Processing and optimizing image...'
                  : `Click or drag & drop your ${type === 'logo' ? 'store logo' : 'favicon'} here`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
