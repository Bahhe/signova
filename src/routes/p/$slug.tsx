import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getProductBySlugServerFn } from '#/lib/server-products'
import { useProducts } from '#/lib/use-products'
import { ProductPageView } from '#/components/product-page-view'
import { Button } from '#/components/ui/button'
import { PackageX, ArrowLeft, Plus } from 'lucide-react'

export const Route = createFileRoute('/p/$slug')({
  loader: async ({ params }) => {
    try {
      const product = await getProductBySlugServerFn({ data: params.slug })
      return { serverProduct: product }
    } catch {
      return { serverProduct: null }
    }
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.serverProduct?.title
      ? `${loaderData.serverProduct.title} | Signova`
      : `Product | Signova`
    const description = loaderData?.serverProduct?.description?.slice(0, 160) || ''
    const image = loaderData?.serverProduct?.images?.[0]?.url || ''

    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        ...(image ? [{ property: 'og:image', content: image }] : []),
      ],
    }
  },
  component: GeneratedProductPageRoute,
})

function GeneratedProductPageRoute() {
  const { slug } = Route.useParams()
  const { serverProduct } = Route.useLoaderData()
  const { getProduct } = useProducts()
  const navigate = useNavigate()

  // Prefer server product, fallback to client-cached product
  const product = serverProduct || getProduct(slug)

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
        <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
          <PackageX className="size-12" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          The product page for slug <code className="text-primary font-mono font-semibold">/p/{slug}</code> does not exist or may have been removed.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void navigate({ to: '/' })}>
            <ArrowLeft className="size-4 mr-1.5" />
            Back to Admin Dashboard
          </Button>
          <Button size="sm" onClick={() => void navigate({ to: '/' })}>
            <Plus className="size-4 mr-1.5" />
            Create this Product
          </Button>
        </div>
      </div>
    )
  }

  return <ProductPageView product={product} />
}
