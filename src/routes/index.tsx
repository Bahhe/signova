import * as React from 'react'
import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { Package, Search, Plus, Store, FilterX } from 'lucide-react'
import type { Product } from '#/lib/types'
import { useProducts } from '#/lib/use-products'
import { ProductForm } from '#/components/product-form'
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
import { getSessionServerFn } from '#/lib/server-auth'

export const Route = createFileRoute('/')({
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
  component: AdminDashboard,
})

function AdminDashboard() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()
  const { products, saveProduct, deleteProduct } = useProducts()
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [search, setSearch] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All')
  const formRef = React.useRef<HTMLDivElement>(null)

  const handleSave = async (product: Product, andView = false) => {
    await saveProduct(product)
    setEditingProduct(null)
    if (andView) {
      void navigate({ to: `/p/${product.slug}` })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNew = () => {
    setEditingProduct(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase())

      return matchSearch && matchCat
    })
  }, [products, search, selectedCategory])

  return (
    <DirectionProvider dir="ltr">
      <SidebarProvider>
        <DashboardSidebar
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onNewProduct={handleNew}
        />
        <SidebarInset className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
          {/* Inset Top Bar */}
          <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <span className="font-bold text-sm tracking-tight">Admin Dashboard</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                • {session.user.name ? `${session.user.name}'s Studio` : 'Product Studio'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/p"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md"
                title="View Public Showcase"
              >
                <Store className="size-3.5" />
                <span className="hidden sm:inline">Showcase</span>
              </a>
              <ThemeToggle />
              <Button size="xs" onClick={handleNew} className="gap-1 h-8 text-xs">
                <Plus className="size-3.5" />
                <span>New</span>
              </Button>
            </div>
          </header>

          {/* Main Container */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-8 w-full flex-1">
            {/* Form Section */}
            <div ref={formRef}>
              <ProductForm
                key={editingProduct?.id || 'new'}
                initialProduct={editingProduct}
                existingProducts={products}
                onSave={handleSave}
                onCancel={editingProduct ? () => setEditingProduct(null) : undefined}
              />
            </div>

            {/* Products List Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    Products ({filtered.length}{selectedCategory !== 'All' ? ` of ${products.length}` : ''})
                  </h2>
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      <span>{selectedCategory}</span>
                      <FilterX className="size-3" />
                    </button>
                  )}
                </div>

                {products.length > 3 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filter products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                )}
              </div>

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
                <div className="p-8 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground space-y-2">
                  <p>
                    {search || selectedCategory !== 'All'
                      ? 'No products match your search or category filter.'
                      : 'No products created yet. Use the form above to create your first product.'}
                  </p>
                  {(search || selectedCategory !== 'All') && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setSelectedCategory('All')
                      }}
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  )
}
