import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Package, Search, Plus, Store, FilterX, X } from 'lucide-react'
import type { Product } from '#/lib/types'
import { useProducts } from '#/lib/use-products'
import { ProductCard } from '#/components/product-card'
import { ThemeToggle } from '#/components/theme-toggle'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { DashboardSidebar } from '#/components/dashboard-sidebar'
import { DirectionProvider } from '#/components/direction-provider'
import { getProductsServerFn } from '#/lib/server-products'
import { getShopUrl } from '#/lib/domain'

export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    try {
      const products = await getProductsServerFn()
      return { initialProducts: products }
    } catch {
      return { initialProducts: [] }
    }
  },
  head: () => ({
    meta: [
      { title: 'All Products | Signova Dashboard' },
      {
        name: 'description',
        content: 'Manage and customize your products and landing showcases.',
      },
    ],
  }),
  component: AdminDashboard,
})

function AdminDashboard() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()
  const { initialProducts } = Route.useLoaderData()
  const { products, deleteProduct } = useProducts(initialProducts)
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All')

  const handleEdit = (product: Product) => {
    void navigate({
      to: '/dashboard/new',
      search: { edit: product.id },
    })
  }

  const handleNew = () => {
    void navigate({ to: '/dashboard/new' })
  }

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())

      const matchCat =
        selectedCategory === 'All' ||
        (p.category &&
          p.category.toLowerCase() === selectedCategory.toLowerCase())

      return matchSearch && matchCat
    })
  }, [products, search, selectedCategory])

  const shopShowcaseUrl = getShopUrl('/')

  return (
    <DirectionProvider dir="ltr">
      <SidebarProvider>
        <DashboardSidebar
          products={products}
          currentRoute="products"
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onNewProduct={handleNew}
          session={session}
        />
        <SidebarInset className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
          {/* Inset Top Bar */}
          <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <span className="font-bold text-sm tracking-tight">
                Admin Dashboard
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                •{' '}
                {session.user.name
                  ? `${session.user.name}'s Studio`
                  : 'Product Studio'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={shopShowcaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
                title="View Public Showcase"
              >
                <Store className="size-3.5" />
                <span className="hidden sm:inline">Showcase</span>
              </a>
              <ThemeToggle />
              <Button
                size="xs"
                onClick={handleNew}
                className="gap-1 h-8 text-xs font-semibold"
              >
                <Plus className="size-3.5" />
                <span>New Product</span>
              </Button>
            </div>
          </header>

          {/* Main Container */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 w-full flex-1">
            {/* Page Title & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Package className="size-6 text-primary" />
                  <span>All Products</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  View and manage all items in your store catalogue.
                </p>
              </div>

              <Button
                size="sm"
                onClick={handleNew}
                className="gap-1.5 text-xs h-9 font-semibold shadow-xs self-start sm:self-auto"
              >
                <Plus className="size-4" />
                <span>Add New Product</span>
              </Button>
            </div>

            {/* Products Search & Filter Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Products ({filtered.length}
                    {selectedCategory !== 'All' || search ? ` of ${products.length}` : ''})
                  </span>
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      title="Clear category filter"
                    >
                      <span>{selectedCategory}</span>
                      <FilterX className="size-3" />
                    </button>
                  )}
                </div>

                {/* Search Bar: Always shown */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, slug or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 pr-7 text-xs bg-background"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title="Clear search"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Products List */}
              {filtered.length > 0 ? (
                <div className="space-y-2.5">
                  {filtered.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={(id) => void deleteProduct(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground space-y-3 bg-card/40">
                  <Package className="size-8 mx-auto text-muted-foreground/50 stroke-1" />
                  <p className="text-sm font-medium text-foreground">
                    {search || selectedCategory !== 'All'
                      ? 'No products match your search or filter'
                      : 'No products added yet'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {search || selectedCategory !== 'All'
                      ? 'Try adjusting your search terms or clearing active filters.'
                      : 'Get started by creating your first product to display on your storefront.'}
                  </p>
                  <div className="pt-2">
                    {search || selectedCategory !== 'All' ? (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setSearch('')
                          setSelectedCategory('All')
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleNew}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Plus className="size-3.5" />
                        <span>Create First Product</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  )
}
