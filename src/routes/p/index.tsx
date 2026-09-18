import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getProductsServerFn } from '#/lib/server-products'
import { useProducts } from '#/lib/use-products'
import {
  Sparkles,
  Store,
  Search,
  ExternalLink,
  ArrowLeft,
  Images,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/p/')({
  loader: async () => {
    try {
      const products = await getProductsServerFn()
      return { serverProducts: products }
    } catch {
      return { serverProducts: [] }
    }
  },
  head: () => ({
    meta: [
      { title: 'Product Showcase | Signova' },
      { name: 'description', content: 'Explore all generated product pages.' },
    ],
  }),
  component: PublicShowcasePage,
})

function PublicShowcasePage() {
  const { serverProducts } = Route.useLoaderData()
  const { products: clientProducts } = useProducts()
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All')

  // Combine server and client products
  const products = clientProducts.length > 0 ? clientProducts : serverProducts

  const categories = React.useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['All', ...Array.from(set)]
  }, [products])

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())

      const matchCat =
        selectedCategory === 'All' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase())

      return matchSearch && matchCat
    })
  }, [products, search, selectedCategory])

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Top Bar */}
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">Product Showcase</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Browse generated product landing pages
              </p>
            </div>
          </div>

          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Admin Dashboard</span>
          </a>
        </div>
      </header>

      {/* Hero Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center space-y-3">
        <Badge variant="accent" className="text-xs">
          Generated Storefront
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Curated Product Collections
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Explore single-product presentation pages generated through the admin studio, each equipped with custom ordered image galleries.
        </p>

        {/* Search and Category Filter */}
        <div className="pt-6 max-w-md mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-sm bg-card"
            />
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
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
              const cover = product.images?.[0]
              return (
                <a
                  key={product.id}
                  href={`/p/${product.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all duration-300"
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

                    <div className="absolute top-3 left-3 flex gap-1">
                      {product.category && (
                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold backdrop-blur-xs bg-background/80">
                          {product.category}
                        </Badge>
                      )}
                      {product.badge && (
                        <Badge variant="default" className="text-[10px]">
                          {product.badge}
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                      <Images className="size-3" />
                      <span>{product.images?.length || 0}</span>
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
                      <span className="font-mono text-[11px] text-primary/80">
                        /p/{product.slug}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                        Explore <ExternalLink className="size-3" />
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border max-w-md mx-auto space-y-3">
            <p className="text-sm text-muted-foreground">No products found matching your filter.</p>
            <Button size="xs" variant="outline" onClick={() => { setSearch(''); setSelectedCategory('All'); }}>
              Clear Filter
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
