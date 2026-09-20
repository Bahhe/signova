import * as React from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { ArrowLeft, Store, PackagePlus } from 'lucide-react'
import type { Product } from '#/lib/types'
import { useProducts } from '#/lib/use-products'
import { ProductForm } from '#/components/product-form'
import { ThemeToggle } from '#/components/theme-toggle'
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

interface NewProductSearchParams {
  edit?: string
}

export const Route = createFileRoute('/dashboard/new')({
  validateSearch: (search: Record<string, unknown>): NewProductSearchParams => ({
    edit: typeof search.edit === 'string' ? search.edit : undefined,
  }),
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
      { title: 'New Product | Signova Dashboard' },
      {
        name: 'description',
        content: 'Create and customize product pages for your store.',
      },
    ],
  }),
  component: NewProductPage,
})

function NewProductPage() {
  const navigate = useNavigate()
  const { session } = Route.useRouteContext()
  const { initialProducts } = Route.useLoaderData()
  const { products, saveProduct } = useProducts(initialProducts)
  const searchParams = Route.useSearch()
  const editId = searchParams.edit

  const editingProduct = React.useMemo(() => {
    if (!editId) return null
    return products.find((p) => p.id === editId || p.slug === editId) || null
  }, [editId, products])

  const handleSave = async (product: Product, andView = false) => {
    await saveProduct(product)
    if (andView) {
      const productUrl = getShopUrl(`/${product.slug}`)
      window.open(productUrl, '_blank')
    }
    void navigate({ to: '/dashboard' })
  }

  const handleCancel = () => {
    void navigate({ to: '/dashboard' })
  }

  const shopShowcaseUrl = getShopUrl('/')

  return (
    <DirectionProvider dir="ltr">
      <SidebarProvider>
        <DashboardSidebar
          products={products}
          currentRoute="new-product"
          session={session}
        />
        <SidebarInset className="min-h-screen bg-background text-foreground transition-colors flex flex-col">
          {/* Inset Top Bar */}
          <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                <span>All Products</span>
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <span className="font-bold text-sm tracking-tight">
                {editingProduct ? 'Edit Product' : 'New Product'}
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
            </div>
          </header>

          {/* Main Container */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6 w-full flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <PackagePlus className="size-5 text-primary" />
                  <span>
                    {editingProduct
                      ? `Edit "${editingProduct.title}"`
                      : 'Create New Product'}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {editingProduct
                    ? 'Update images, description, pricing, and variant details for this product.'
                    : 'Configure product details, images, variants, and settings to publish a new product.'}
                </p>
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={handleCancel}
                className="gap-1.5 text-xs h-8"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back to Products</span>
              </Button>
            </div>

            {/* Product Form */}
            <ProductForm
              key={editingProduct?.id || 'new'}
              initialProduct={editingProduct}
              existingProducts={products}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DirectionProvider>
  )
}
