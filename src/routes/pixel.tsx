import * as React from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Save,
  ExternalLink,
  Zap,
  Copy,
  Check,
  Eye,
  ShoppingCart,
  DollarSign,
  HelpCircle,
  Sparkles,
  RotateCw,
} from 'lucide-react'
import { getSessionServerFn } from '#/lib/server-auth'
import { getProductsServerFn } from '#/lib/server-products'
import {
  getStorefrontSettingsServerFn,
  saveStorefrontSettingsServerFn,
} from '#/lib/server-settings'
import { isValidPixelId } from '#/lib/meta-pixel'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import { ThemeToggle } from '#/components/theme-toggle'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { DashboardSidebar } from '#/components/dashboard-sidebar'
import { DirectionProvider } from '#/components/direction-provider'

export const Route = createFileRoute('/pixel')({
  beforeLoad: async () => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({
        to: '/p',
      })
    }

    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw redirect({
        to: '/p',
      })
    }

    return {
      session,
    }
  },
  loader: async () => {
    try {
      const [initialSettings, products] = await Promise.all([
        getStorefrontSettingsServerFn().catch(() => null),
        getProductsServerFn().catch(() => []),
      ])
      return { initialSettings, products }
    } catch {
      return { initialSettings: null, products: [] }
    }
  },
  head: () => ({
    meta: [
      { title: 'Meta Pixel Settings | SignovaPub Dashboard' },
      {
        name: 'description',
        content:
          'Configure Meta Pixel (Facebook Pixel) tracking for product views and order purchases.',
      },
    ],
  }),
  component: MetaPixelDashboardPage,
})

function MetaPixelDashboardPage() {
  const { initialSettings, products } = Route.useLoaderData()

  const [pixelId, setPixelId] = React.useState(
    () => initialSettings?.metaPixelId || '',
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [copied, setCopied] = React.useState(false)

  const isConfigured = Boolean(pixelId.trim())
  const isValidFormat = !pixelId.trim() || isValidPixelId(pixelId)

  const handleCopyId = () => {
    if (!pixelId) return
    navigator.clipboard.writeText(pixelId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage(null)

    const cleanPixelId = pixelId.trim()

    try {
      const updated = await saveStorefrontSettingsServerFn({
        data: {
          metaPixelId: cleanPixelId,
        },
      })

      setPixelId(updated.metaPixelId || '')
      setStatusMessage({
        type: 'success',
        text: cleanPixelId
          ? 'Meta Pixel ID saved successfully! Events will now be tracked across storefront pages.'
          : 'Meta Pixel ID has been cleared. Tracking is currently disabled.',
      })
      setTimeout(() => setStatusMessage(null), 6000)
    } catch (err: any) {
      console.error('Failed to save Meta Pixel ID:', err)
      setStatusMessage({
        type: 'error',
        text:
          err.message ||
          'Failed to save Meta Pixel settings. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to disable Meta Pixel tracking?')) {
      return
    }
    setPixelId('')
    setIsSaving(true)
    try {
      await saveStorefrontSettingsServerFn({
        data: {
          metaPixelId: '',
        },
      })
      setStatusMessage({
        type: 'success',
        text: 'Meta Pixel disabled successfully.',
      })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to clear Meta Pixel.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DirectionProvider dir="ltr">
      <div
        dir="ltr"
        className="min-h-screen bg-background text-foreground font-sans"
      >
        <SidebarProvider>
          <DashboardSidebar products={products} currentRoute="pixel" />
          <SidebarInset className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Inset Top Bar */}
            <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 h-14 flex items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  <span className="font-semibold text-sm">
                    Meta Pixel Tracking
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-mono tracking-wider"
                  >
                    Analytics
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/p"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                >
                  <Eye className="size-3.5" />
                  <span>View Storefront</span>
                  <ExternalLink className="size-3 text-muted-foreground/60" />
                </a>
                <ThemeToggle />
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
              {/* Header Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                      Meta Pixel
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      Connect your Facebook / Meta Pixel ID to track customer
                      engagement, product views, and completed purchases in real
                      time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 flex items-center gap-1.5 font-medium text-xs">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Pixel Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 text-xs text-muted-foreground"
                      >
                        Not Configured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Status feedback message */}
              {statusMessage && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                      : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                  )}
                  <div className="text-sm font-medium flex-1">
                    {statusMessage.text}
                  </div>
                </div>
              )}

              {/* Pixel Settings Card */}
              <Card className="border border-border/80 shadow-xs bg-card overflow-hidden">
                <div className="border-b border-border/60 bg-muted/30 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm text-foreground">
                        Meta Pixel Configuration
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Standard dataset & conversion tracking identifier
                      </p>
                    </div>
                  </div>
                  {isConfigured && (
                    <a
                      href={`https://business.facebook.com/events_manager2/list/dataset/${pixelId.trim()}/test_events`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>Events Manager Test Tool</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="pixelId"
                        className="text-sm font-semibold text-foreground flex items-center gap-1.5"
                      >
                        Meta Pixel ID (Dataset ID)
                        <span className="text-destructive">*</span>
                      </Label>
                      {pixelId && (
                        <button
                          type="button"
                          onClick={handleCopyId}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="size-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Input
                        id="pixelId"
                        type="text"
                        placeholder="e.g. 1234567890123456"
                        value={pixelId}
                        onChange={(e) => setPixelId(e.target.value)}
                        className="font-mono text-sm pr-10"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {pixelId && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isValidFormat ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="size-4 text-amber-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {!isValidFormat && pixelId && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Notice: Meta Pixel IDs usually consist of 12 to 18
                        digits. Please make sure there are no accidental spaces
                        or letters.
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enter your Meta Pixel ID
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                    <div>
                      {isConfigured && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClear}
                          disabled={isSaving}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        >
                          Disable Pixel
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={isSaving}
                        className="gap-2 text-sm font-medium"
                      >
                        {isSaving ? (
                          <>
                            <RotateCw className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            Save Pixel ID
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </DirectionProvider>
  )
}
