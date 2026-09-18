import * as React from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Settings,
  Phone,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Store,
  Share2,
  Eye,
  Info,
  BarChart3,
  Cloud,
} from 'lucide-react'
import { getSessionServerFn } from '#/lib/server-auth'
import { getProductsServerFn } from '#/lib/server-products'
import {
  getStorefrontSettingsServerFn,
  saveStorefrontSettingsServerFn,
} from '#/lib/server-settings'
import type { StorefrontSettings, StorefrontSocialLinks } from '#/lib/types'
import { DEFAULT_STOREFRONT_SETTINGS } from '#/lib/types'
import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import { Card } from '#/components/ui/card'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { DashboardSidebar } from '#/components/dashboard-sidebar'
import { DirectionProvider } from '#/components/direction-provider'
import { StorefrontFooter } from '#/components/storefront-footer'

export const Route = createFileRoute('/settings')({
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
        getStorefrontSettingsServerFn().catch(
          () => DEFAULT_STOREFRONT_SETTINGS,
        ),
        getProductsServerFn().catch(() => []),
      ])
      return { initialSettings, products }
    } catch {
      return {
        initialSettings: DEFAULT_STOREFRONT_SETTINGS,
        products: [],
      }
    }
  },
  head: () => ({
    meta: [
      { title: 'Storefront & Footer Settings | SignovaPub' },
      {
        name: 'description',
        content:
          'Customize contact information, social media links, and store location displayed in the storefront footer.',
      },
    ],
  }),
  component: StorefrontSettingsPage,
})

function StorefrontSettingsPage() {
  const { initialSettings, products } = Route.useLoaderData()

  const [formData, setFormData] = React.useState<StorefrontSettings>(() => ({
    ...DEFAULT_STOREFRONT_SETTINGS,
    ...initialSettings,
    metaPixelId: initialSettings?.metaPixelId || '',
    socialLinks: {
      ...DEFAULT_STOREFRONT_SETTINGS.socialLinks,
      ...initialSettings.socialLinks,
    },
  }))

  const [isSaving, setIsSaving] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showLivePreview, setShowLivePreview] = React.useState(true)
  const [storageStatus, setStorageStatus] = React.useState<{
    loading: boolean
    result: {
      ok: boolean
      endpoint?: string
      bucket?: string
      latencyMs?: number
      isConfigured?: boolean
      error?: string
    } | null
  }>({ loading: false, result: null })

  const handleTestStorage = async () => {
    setStorageStatus({ loading: true, result: null })
    try {
      const res = await fetch('/api/storage/status')
      const json = await res.json()
      setStorageStatus({ loading: false, result: json })
    } catch (err: any) {
      setStorageStatus({
        loading: false,
        result: { ok: false, error: err.message || 'Connection failed' },
      })
    }
  }

  const handleFieldChange = (
    field: keyof StorefrontSettings,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSocialChange = (
    network: keyof StorefrontSocialLinks,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value,
      },
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage(null)

    try {
      const saved = await saveStorefrontSettingsServerFn({ data: formData })
      setFormData(saved)
      setStatusMessage({
        type: 'success',
        text: 'Storefront and footer settings saved successfully! Changes are immediately reflected across the storefront.',
      })
      setTimeout(() => setStatusMessage(null), 6000)
    } catch (err: any) {
      console.error('Failed to save storefront settings:', err)
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save settings. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to restore all settings to their default values?',
      )
    ) {
      setFormData(DEFAULT_STOREFRONT_SETTINGS)
    }
  }

  return (
    <DirectionProvider dir="ltr">
      <SidebarProvider>
        <DashboardSidebar products={products} currentRoute="settings" />
        <SidebarInset className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
          {/* Inset Top Bar */}
          <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <span className="font-bold text-sm tracking-tight">
                Storefront Settings
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                • Contact, Footer & Social Links
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/p"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
                title="View Live Storefront"
              >
                <Store className="size-3.5" />
                <span className="hidden sm:inline">Showcase</span>
                <ExternalLink className="size-3 opacity-60" />
              </a>
              <ThemeToggle />
              <Button
                size="xs"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 h-8 text-xs font-semibold"
              >
                {isSaving ? (
                  <RotateCw className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </Button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 w-full flex-1">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <Settings className="size-6 text-primary" />
                  <span>Storefront & Footer Settings</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure contact numbers, email, social media links, and
                  store location displayed in the storefront footer and product
                  pages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className="gap-1.5 text-xs"
                >
                  <Eye className="size-3.5" />
                  <span>
                    {showLivePreview ? 'Hide Preview' : 'Preview Footer'}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleResetToDefaults}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>

            {/* Status Feedback Banner */}
            {statusMessage && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in text-sm ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                )}
                <div className="flex-1 font-medium">{statusMessage.text}</div>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-6">
              {/* Card 1: Contact Numbers & Email */}
              <Card className="p-5 sm:p-6 border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">
                      Direct Contact Information
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      These phone numbers and email appear in the footer with
                      direct one-click calling and emailing for customers.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone 1 */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="phone"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Phone className="size-3.5 text-primary" />
                      <span>Primary Phone Number *</span>
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleFieldChange('phone', e.target.value)
                      }
                      placeholder="+213 555 01 23 45"
                      className="font-mono text-xs"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Main contact number for customer support and incoming
                      orders.
                    </p>
                  </div>

                  {/* Phone 2 */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="secondaryPhone"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <PhoneCall className="size-3.5 text-secondary-foreground" />
                      <span>Secondary Phone Number (Optional)</span>
                    </Label>
                    <Input
                      id="secondaryPhone"
                      value={formData.secondaryPhone || ''}
                      onChange={(e) =>
                        handleFieldChange('secondaryPhone', e.target.value)
                      }
                      placeholder="+213 770 98 76 54"
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Additional line or alternative number for quick
                      communication.
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Mail className="size-3.5 text-primary" />
                      <span>Customer Support Email *</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleFieldChange('email', e.target.value)
                      }
                      placeholder="contact@signova.store"
                      className="font-mono text-xs"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      For receiving customer inquiries, order notes, and support
                      requests.
                    </p>
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="workingHours"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>Working Hours & Support</span>
                    </Label>
                    <Input
                      id="workingHours"
                      value={formData.workingHours || ''}
                      onChange={(e) =>
                        handleFieldChange('workingHours', e.target.value)
                      }
                      placeholder="Customer Service: 7/7 days from 09:00 to 20:00"
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Operating hours when your customer care and order
                      confirmation team is available.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card 2: Location & Address */}
              <Card className="p-5 sm:p-6 border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">
                      Location & Physical Address
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Store headquarters or city address shown to customers to
                      build trust and credibility.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location Text */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="location"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <MapPin className="size-3.5 text-emerald-600" />
                      <span>Address or City / Headquarters *</span>
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleFieldChange('location', e.target.value)
                      }
                      placeholder="Algiers, Algeria"
                      className="text-xs"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      E.g., Algiers, Oran, Setif, or your detailed office /
                      warehouse address.
                    </p>
                  </div>

                  {/* Location URL */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="locationUrl"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                      <span>Google Maps URL (Optional)</span>
                    </Label>
                    <Input
                      id="locationUrl"
                      value={formData.locationUrl || ''}
                      onChange={(e) =>
                        handleFieldChange('locationUrl', e.target.value)
                      }
                      placeholder="https://maps.google.com/..."
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Direct map link that opens when a customer clicks "View on
                      map" in the footer.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card 3: Social Media Links */}
              <Card className="p-5 sm:p-6 border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                  <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Share2 className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">Social Media Links</h2>
                    <p className="text-xs text-muted-foreground">
                      Social icons will only appear in the footer for platforms
                      where a valid URL is provided.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="facebook"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#1877F2]">f</span>
                      <span>Facebook Page</span>
                    </Label>
                    <Input
                      id="facebook"
                      value={formData.socialLinks.facebook || ''}
                      onChange={(e) =>
                        handleSocialChange('facebook', e.target.value)
                      }
                      placeholder="https://facebook.com/yourpage"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="instagram"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#E4405F]">IG</span>
                      <span>Instagram Profile</span>
                    </Label>
                    <Input
                      id="instagram"
                      value={formData.socialLinks.instagram || ''}
                      onChange={(e) =>
                        handleSocialChange('instagram', e.target.value)
                      }
                      placeholder="https://instagram.com/yourbrand"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="whatsapp"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#25D366]">WA</span>
                      <span>WhatsApp (Phone Number or Direct Link)</span>
                    </Label>
                    <Input
                      id="whatsapp"
                      value={formData.socialLinks.whatsapp || ''}
                      onChange={(e) =>
                        handleSocialChange('whatsapp', e.target.value)
                      }
                      placeholder="+213 555 01 23 45 or https://wa.me/213555012345"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="tiktok"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-foreground">TT</span>
                      <span>TikTok Profile</span>
                    </Label>
                    <Input
                      id="tiktok"
                      value={formData.socialLinks.tiktok || ''}
                      onChange={(e) =>
                        handleSocialChange('tiktok', e.target.value)
                      }
                      placeholder="https://tiktok.com/@yourbrand"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Telegram */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="telegram"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#229ED9]">TG</span>
                      <span>Telegram Channel or Handle</span>
                    </Label>
                    <Input
                      id="telegram"
                      value={formData.socialLinks.telegram || ''}
                      onChange={(e) =>
                        handleSocialChange('telegram', e.target.value)
                      }
                      placeholder="https://t.me/yourchannel"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="youtube"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#FF0000]">YT</span>
                      <span>YouTube Channel</span>
                    </Label>
                    <Input
                      id="youtube"
                      value={formData.socialLinks.youtube || ''}
                      onChange={(e) =>
                        handleSocialChange('youtube', e.target.value)
                      }
                      placeholder="https://youtube.com/@yourchannel"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Twitter / X */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="twitter"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-foreground">X</span>
                      <span>X (Twitter) Profile</span>
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.socialLinks.twitter || ''}
                      onChange={(e) =>
                        handleSocialChange('twitter', e.target.value)
                      }
                      placeholder="https://x.com/yourhandle"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="linkedin"
                      className="text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#0A66C2]">IN</span>
                      <span>LinkedIn Company Page</span>
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.socialLinks.linkedin || ''}
                      onChange={(e) =>
                        handleSocialChange('linkedin', e.target.value)
                      }
                      placeholder="https://linkedin.com/company/yourbrand"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </Card>

              {/* Card 4: Storefront Branding in Footer */}
              <Card className="p-5 sm:p-6 border-border/80 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                  <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Store className="size-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">
                      Store Branding & Footer Bio
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Store name and brief description displayed in the footer
                      below the brand logo.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="storeName"
                      className="text-xs font-semibold"
                    >
                      Store Name
                    </Label>
                    <Input
                      id="storeName"
                      value={formData.storeName || ''}
                      onChange={(e) =>
                        handleFieldChange('storeName', e.target.value)
                      }
                      placeholder="Signova"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="storeDescription"
                      className="text-xs font-semibold"
                    >
                      Store Bio / Description (displayed below logo in footer)
                    </Label>
                    <Textarea
                      id="storeDescription"
                      rows={3}
                      value={formData.storeDescription || ''}
                      onChange={(e) =>
                        handleFieldChange('storeDescription', e.target.value)
                      }
                      placeholder="Your trusted shopping destination. We provide hand-picked, premium products with rapid delivery and authentic guarantee..."
                      className="text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </Card>

              {/* Card 5: Meta Pixel Integration */}
              <Card className="p-5 sm:p-6 border-border/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <BarChart3 className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">
                        Meta Pixel (Facebook Pixel)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Track product views and order purchases automatically.
                      </p>
                    </div>
                  </div>
                  <a
                    href="/pixel"
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>Dedicated Pixel Page</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="metaPixelId"
                    className="text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>Meta Pixel ID (Dataset ID)</span>
                  </Label>
                  <Input
                    id="metaPixelId"
                    value={formData.metaPixelId || ''}
                    onChange={(e) =>
                      handleFieldChange('metaPixelId', e.target.value)
                    }
                    placeholder="e.g. 1234567890123456"
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Your 15-16 digit Meta Pixel ID.
                  </p>
                </div>
              </Card>

              {/* Card 6: Storage & Media Bucket (SeaweedFS / S3) */}
              <Card className="p-5 sm:p-6 border-border/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                      <Cloud className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">
                        Storage & Media Bucket (SeaweedFS / S3)
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Images uploaded for products are stored in an S3-compatible object storage bucket.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleTestStorage}
                    disabled={storageStatus.loading}
                    className="gap-1.5 text-xs h-7"
                  >
                    {storageStatus.loading ? (
                      <RotateCw className="size-3 animate-spin" />
                    ) : (
                      <Cloud className="size-3" />
                    )}
                    <span>{storageStatus.loading ? 'Testing...' : 'Test Connection'}</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    By default, the server connects via environment variables:{' '}
                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">SEAWEEDFS_S3_ENDPOINT</code>,{' '}
                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">SEAWEEDFS_ACCESS_KEY</code>,{' '}
                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">SEAWEEDFS_SECRET_KEY</code>, and{' '}
                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">SEAWEEDFS_BUCKET</code>.
                  </p>

                  {storageStatus.result && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                        storageStatus.result.ok
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                          : 'bg-destructive/10 border-destructive/20 text-destructive'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {storageStatus.result.ok ? (
                          <>
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Storage Bucket Connected Successfully!</span>
                            {storageStatus.result.latencyMs !== undefined && (
                              <span className="font-mono text-[10px] opacity-80">
                                ({storageStatus.result.latencyMs}ms)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="size-4 text-destructive" />
                            <span>Storage Connection Failed</span>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="font-semibold opacity-70">Endpoint: </span>
                          <span className="font-mono">{storageStatus.result.endpoint || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="font-semibold opacity-70">Bucket: </span>
                          <span className="font-mono">{storageStatus.result.bucket || 'signovas3'}</span>
                        </div>
                      </div>

                      {storageStatus.result.error && (
                        <div className="p-2 rounded bg-background/50 text-[11px] font-mono leading-relaxed mt-2 border border-destructive/20">
                          {storageStatus.result.error}
                        </div>
                      )}

                      {!storageStatus.result.ok && (
                        <p className="text-[11px] opacity-90 pt-1">
                          Tip: In Coolify or Docker, ensure the app container can reach SeaweedFS. Set{' '}
                          <code className="font-mono bg-background/60 px-1 py-0.5 rounded">
                            SEAWEEDFS_S3_ENDPOINT=http://&lt;service-name&gt;:8333
                          </code>{' '}
                          in your environment variables.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Base64 Images in Database Warning */}
                  {products.flatMap((p) => p.images || []).some((img) => img.url?.startsWith('data:image/')) && (
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                      <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Base64 Images Detected in Database</p>
                        <p className="text-[11px] opacity-90 leading-relaxed">
                          One or more products currently have images stored as inline base64 strings instead of S3 bucket URLs.
                          Once your S3 storage is connected, simply opening each product and clicking &quot;Update&quot; will automatically upload and migrate those images into your bucket!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="size-3.5 text-primary" />
                  <span>
                    The footer is displayed on customer storefront pages
                    (showcase and product pages) in RTL.
                  </span>
                </p>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 h-10 px-6 font-bold shadow-sm"
                >
                  {isSaving ? (
                    <RotateCw className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </Button>
              </div>
            </form>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  )
}
