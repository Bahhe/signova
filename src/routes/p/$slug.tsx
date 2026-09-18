import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getProductBySlugServerFn } from '#/lib/server-products'
import { getStorefrontSettingsServerFn } from '#/lib/server-settings'
import { useProducts } from '#/lib/use-products'
import { authClient } from '#/lib/auth-client'
import { ProductPageView } from '#/components/product-page-view'
import { DirectionProvider } from '#/components/direction-provider'
import { Button } from '#/components/ui/button'
import { PackageX, ArrowRight, Plus, LayoutDashboard } from 'lucide-react'

export const Route = createFileRoute('/p/$slug')({
  loader: async ({ params }) => {
    try {
      const [product, settings] = await Promise.all([
        getProductBySlugServerFn({ data: params.slug }).catch(() => null),
        getStorefrontSettingsServerFn().catch(() => null),
      ])
      return { serverProduct: product, serverSettings: settings }
    } catch {
      return { serverProduct: null, serverSettings: null }
    }
  },
  head: ({ loaderData }) => {
    const serverProd = loaderData?.serverProduct
    const title = serverProd?.title
      ? `${serverProd.title} | SignovaPub`
      : `المنتج | SignovaPub`
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
  component: GeneratedProductPageRoute,
})

function GeneratedProductPageRoute() {
  const { slug } = Route.useParams()
  const { serverProduct, serverSettings } = Route.useLoaderData()
  const { getProduct } = useProducts()
  const navigate = useNavigate()

  const { data: session } = authClient.useSession()
  const user = session?.user as { role?: string } | undefined
  const isAdmin = user?.role === 'admin'

  // Prefer server product, fallback to client-cached product
  const product = serverProduct || getProduct(slug)

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
              /p/{slug}
            </code>{' '}
            غير متوفرة أو ربما تم حذفها.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void navigate({ to: '/p' })}
            >
              <ArrowRight className="size-4 ms-1.5" />
              العودة إلى المعرض
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void navigate({ to: '/' })}
                >
                  <LayoutDashboard className="size-4 ms-1.5" />
                  لوحة التحكم
                </Button>
                <Button size="sm" onClick={() => void navigate({ to: '/' })}>
                  <Plus className="size-4 ms-1.5" />
                  إضافة هذا المنتج
                </Button>
              </>
            )}
          </div>
        </div>
      </DirectionProvider>
    )
  }

  return (
    <DirectionProvider dir="rtl">
      <ProductPageView
        product={product}
        settings={serverSettings}
        isAdmin={isAdmin}
      />
    </DirectionProvider>
  )
}
