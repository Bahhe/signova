import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getProductBySlugServerFn } from '#/lib/server-products'
import { getStorefrontSettingsServerFn } from '#/lib/server-settings'
import { getHostContextServerFn } from '#/lib/server-domain'
import { useProducts } from '#/lib/use-products'
import { ProductPageView } from '#/components/product-page-view'
import { DirectionProvider } from '#/components/direction-provider'
import { Button } from '#/components/ui/button'
import { PackageX, ArrowRight } from 'lucide-react'
import { isShopDomain, getShopUrl } from '#/lib/domain'

export const Route = createFileRoute('/$slug')({
  loader: async ({ params }) => {
    try {
      const [hostContext, product, settings] = await Promise.all([
        getHostContextServerFn().catch(() => ({
          isShop: false,
          hostname: '',
          subdomain: null,
          host: '',
        })),
        getProductBySlugServerFn({ data: params.slug }).catch(() => null),
        getStorefrontSettingsServerFn().catch(() => null),
      ])

      return {
        hostContext,
        serverProduct: product,
        serverSettings: settings,
      }
    } catch {
      return {
        hostContext: {
          isShop: false,
          hostname: '',
          subdomain: null,
          host: '',
        },
        serverProduct: null,
        serverSettings: null,
      }
    }
  },
  head: ({ loaderData }) => {
    const serverProd = loaderData?.serverProduct
    const storeName =
      loaderData?.serverSettings?.storeName?.trim() || 'Signova'
    const title = serverProd?.title
      ? `${serverProd.title} | ${storeName}`
      : `المنتج | ${storeName}`
    const description = serverProd ? serverProd.description.slice(0, 160) : ''
    const image = serverProd ? serverProd.images[0]?.url || '' : ''

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
  component: ProductPageSlugRoute,
})

function ProductPageSlugRoute() {
  const { slug } = Route.useParams()
  const { serverProduct, serverSettings } = Route.useLoaderData()
  const { getProduct } = useProducts()

  // Prefer server product, fallback to client-cached product
  const product = serverProduct || getProduct(slug)

  // If visited on main domain in browser, redirect to shop subdomain
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isShopDomain()) {
      const shopUrl = getShopUrl(`/${slug}`)
      if (window.location.href !== shopUrl) {
        window.location.replace(shopUrl)
      }
    }
  }, [slug])

  if (!product) {
    return (
      <DirectionProvider dir="rtl">
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center font-arabic">
          <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
            <PackageX className="size-12" />
          </div>
          <h1 className="text-2xl font-bold mb-2">المنتج غير موجود</h1>
          <p className="text-muted-foreground text-sm max-w-md mb-6 leading-relaxed">
            صفحة المنتج للرابط{' '}
            <code className="text-primary font-mono font-semibold" dir="ltr">
              /{slug}
            </code>{' '}
            غير متوفرة أو ربما تم حذفها.
          </p>

          <Button asChild>
            <a href={getShopUrl('/')} className="gap-2">
              <ArrowRight className="size-4" />
              <span>العودة إلى متجر المنتجات</span>
            </a>
          </Button>
        </div>
      </DirectionProvider>
    )
  }

  return (
    <ProductPageView
      product={product}
      settings={serverSettings}
    />
  )
}
