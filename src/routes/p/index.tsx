import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getProductsServerFn } from '#/lib/server-products'
import { getStorefrontSettingsServerFn } from '#/lib/server-settings'
import { useProducts } from '#/lib/use-products'
import { authClient } from '#/lib/auth-client'
import { ThemeToggle } from '#/components/theme-toggle'
import { DirectionProvider } from '#/components/direction-provider'
import { StorefrontFooter } from '#/components/storefront-footer'
import { MetaPixelScript } from '#/components/meta-pixel-script'
import {
  Sparkles,
  Store,
  Search,
  ArrowLeft,
  LayoutDashboard,
  Images,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/p/')({
  loader: async () => {
    try {
      const [products, settings] = await Promise.all([
        getProductsServerFn().catch(() => []),
        getStorefrontSettingsServerFn().catch(() => null),
      ])
      return { serverProducts: products, serverSettings: settings }
    } catch {
      return { serverProducts: [], serverSettings: null }
    }
  },
  head: () => ({
    meta: [
      { title: 'معرض المنتجات | SignovaPub' },
      {
        name: 'description',
        content:
          'استكشف وتصفح جميع صفحات المنتجات المميزة وصفحات الهبوط المخصصة.',
      },
    ],
  }),
  component: PublicShowcasePage,
})

function PublicShowcasePage() {
  const { serverProducts, serverSettings } = Route.useLoaderData()
  const { products: clientProducts } = useProducts(serverProducts)
  const { data: session } = authClient.useSession()
  const user = session?.user as { role?: string } | undefined
  const isAdmin = user?.role === 'admin'
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('الكل')

  // Combine server and client products
  const products = clientProducts.length > 0 ? clientProducts : serverProducts

  const categories = React.useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['الكل', ...Array.from(set)]
  }, [products])

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (!isAdmin && p.published === false) return false

      const matchSearch =
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())

      const matchCat =
        selectedCategory === 'الكل' ||
        (p.category &&
          p.category.toLowerCase() === selectedCategory.toLowerCase())

      return matchSearch && matchCat
    })
  }, [products, search, selectedCategory, isAdmin])

  return (
    <DirectionProvider dir="rtl">
      <div
        className="min-h-screen bg-background text-foreground flex flex-col font-arabic"
        dir="rtl"
      >
        <MetaPixelScript pixelId={serverSettings?.metaPixelId} />

        {/* Top Bar */}
        <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {serverSettings?.logoUrl ? (
                <img
                  src={serverSettings.logoUrl}
                  alt={serverSettings.storeName || 'Store Logo'}
                  className="h-10 w-auto max-w-[150px] object-contain rounded-md"
                />
              ) : (
                <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
                  <Store className="size-5" />
                </div>
              )}
              <div>
                <h1 className="text-base font-bold leading-none">
                  {serverSettings?.storeName || 'معرض المنتجات'}
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {serverSettings?.logoUrl
                    ? 'معرض المنتجات الحصرية'
                    : 'تصفح المنتجات الحصرية'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/" className="gap-1.5 text-xs font-semibold">
                    <LayoutDashboard className="size-3.5" />
                    <span>لوحة التحكم</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center space-y-3">
          <Badge
            variant="outline"
            className="text-xs border-primary/30 text-primary bg-primary/5"
          >
            متجر المنتجات الحصرية
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            مجموعات المنتجات المميزة
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            اكتشف المنتجات مع معرض الصور المخصصة وخيار الطلب المباشر السريع
            والدفع عند الاستلام.
          </p>

          {/* Search and Category Filter */}
          <div className="pt-6 max-w-md mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن المنتجات بالاسم أو الوصف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10 h-10 text-sm bg-card text-right"
                dir="rtl"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                        : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => {
                const cover = product.images[0]
                return (
                  <a
                    key={product.id}
                    href={`/p/${product.slug}`}
                    className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all duration-300 text-right"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
                      {cover ? (
                        <img
                          src={cover.url}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Sparkles className="size-8 opacity-40" />
                        </div>
                      )}

                      <div className="absolute top-3 start-3 flex flex-wrap gap-1">
                        {!product.published && (
                          <Badge variant="destructive" className="text-[10px]">
                            مسودة
                          </Badge>
                        )}
                        {product.category && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold backdrop-blur-xs bg-background/80"
                          >
                            {product.category}
                          </Badge>
                        )}
                        {product.badge && (
                          <Badge variant="default" className="text-[10px]">
                            {product.badge}
                          </Badge>
                        )}
                      </div>

                      <div
                        className="absolute bottom-3 end-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5"
                        dir="ltr"
                      >
                        <Images className="size-3" />
                        <span>{product.images.length}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {product.title}
                          </h3>
                          {product.price && (
                            <span className="font-extrabold text-base text-primary shrink-0">
                              {product.price}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono text-[11px]" dir="ltr">
                          /p/{product.slug}
                        </span>
                        <Button
                          variant="link"
                          size="xs"
                          className="h-auto p-0 font-bold group-hover:-translate-x-1 transition-transform"
                        >
                          <span>استكشف المنتج</span>
                          <ArrowLeft className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border max-w-md mx-auto space-y-3">
              <p className="text-sm text-muted-foreground">
                لم يتم العثور على أي منتج يطابق خيارات البحث الحالية.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('الكل')
                }}
              >
                إعادة ضبط البحث
              </Button>
            </div>
          )}
        </main>

        <StorefrontFooter settings={serverSettings} />
      </div>
    </DirectionProvider>
  )
}
