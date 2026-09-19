import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getProductsServerFn } from '#/lib/server-products'
import { getStorefrontSettingsServerFn } from '#/lib/server-settings'
import { getHostContextServerFn } from '#/lib/server-domain'
import { isShopDomain } from '#/lib/domain'
import { PublicShowcasePage } from '#/components/public-showcase-page'
import { LandingPage } from '#/components/landing-page'

export const Route = createFileRoute('/')({
  loader: async () => {
    try {
      const [hostContext, settings] = await Promise.all([
        getHostContextServerFn().catch(() => ({
          isShop: false,
          hostname: '',
          subdomain: null,
          host: '',
        })),
        getStorefrontSettingsServerFn().catch(() => null),
      ])

      // If on shop subdomain, fetch products for showcase
      const products = hostContext.isShop
        ? await getProductsServerFn().catch(() => [])
        : []

      return {
        hostContext,
        serverProducts: products,
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
        serverProducts: [],
        serverSettings: null,
      }
    }
  },
  head: ({ loaderData }) => {
    const isShop = loaderData?.hostContext?.isShop
    const storeName =
      loaderData?.serverSettings?.storeName?.trim() || 'Signova'

    if (isShop) {
      return {
        meta: [
          { title: `معرض المنتجات | ${storeName}` },
          {
            name: 'description',
            content:
              loaderData?.serverSettings?.storeDescription ||
              'استكشف وتصفح جميع صفحات المنتجات المميزة.',
          },
        ],
      }
    }

    return {
      meta: [
        { title: `${storeName} | Official Website` },
        {
          name: 'description',
          content:
            loaderData?.serverSettings?.storeDescription ||
            `${storeName} official website.`,
        },
      ],
    }
  },
  component: RootIndexRoute,
})

function RootIndexRoute() {
  const { hostContext, serverProducts, serverSettings } = Route.useLoaderData()
  const [isShop, setIsShop] = React.useState<boolean>(hostContext.isShop)

  // Dynamically check client hostname/search on mount to handle localhost dev or URL param switches
  React.useEffect(() => {
    setIsShop(isShopDomain())
  }, [])

  if (isShop) {
    return (
      <PublicShowcasePage
        serverProducts={serverProducts}
        serverSettings={serverSettings}
      />
    )
  }

  return <LandingPage settings={serverSettings} />
}
