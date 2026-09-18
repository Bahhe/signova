import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Package, Search, Plus } from 'lucide-react'
import type { Product } from '#/lib/types'
import { useProducts } from '#/lib/use-products'
import { ProductForm } from '#/components/product-form'
import { ProductCard } from '#/components/product-card'
import { ThemeToggle } from '#/components/theme-toggle'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const navigate = useNavigate()
  const { products, saveProduct, deleteProduct } = useProducts()
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [search, setSearch] = React.useState('')
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
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
  }, [products, search])

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-24">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-bold text-base tracking-tight">Signova</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">• Product Generator</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="xs" onClick={handleNew} className="gap-1 h-8 text-xs">
              <Plus className="size-3.5" />
              <span>New</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
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
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Package className="size-4 text-muted-foreground" />
              Products ({products.length})
            </h2>

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
            <div className="p-8 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              {search ? 'No products match your search.' : 'No products created yet. Use the form above to create your first product.'}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
