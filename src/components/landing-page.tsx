import * as React from 'react'
import type { StorefrontSettings } from '#/lib/types'
import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'
import { ShoppingBag, ArrowUpLeft } from 'lucide-react'
import { getShopUrl } from '#/lib/domain'

interface LandingPageProps {
  settings?: StorefrontSettings | null
}

export function LandingPage({ settings }: LandingPageProps) {
  const storeName = settings?.storeName || 'Signova'
  const [shopUrl, setShopUrl] = React.useState<string>(() => getShopUrl('/'))

  React.useEffect(() => {
    setShopUrl(getShopUrl('/'))
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary font-arabic">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex flex-row-reverse items-center justify-between">
          <div className="flex flex-row-reverse items-center gap-3">
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={storeName}
                className="h-9 w-auto max-w-35 object-contain rounded-md"
              />
            ) : (
              <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-lg tracking-tight hidden sm:inline">
              {storeName}
            </span>
          </div>

          <div className="flex flex-row-reverse items-center gap-3">
            <ThemeToggle />
            <Button
              size="sm"
              asChild
              className="gap-1.5 font-semibold text-xs shadow-sm"
            >
              <a href={shopUrl}>
                <ArrowUpLeft className="size-3 opacity-70" />
                <span>المتجر</span>
                <ShoppingBag className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero Placeholder */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/60 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="text-primary font-semibold">قريباً</span>
            <span className="text-border">•</span>
            <span>الموقع الرسمي</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
              {storeName}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {settings?.storeDescription ||
                'Our official landing page is currently under construction. Explore our full catalog and place orders directly through our shop.'}
            </p>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto gap-2 text-sm font-semibold h-11 px-6 shadow-md"
            >
              <a href={shopUrl}>
                <ArrowUpLeft className="size-3.5 opacity-80" />
                <span>استكشف المنتجات في المتجر</span>
                <ShoppingBag className="size-4" />
              </a>
            </Button>
          </div>

          {/* Note for developer */}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <p>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
