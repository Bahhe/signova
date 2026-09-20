import * as React from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TooltipProvider } from '#/components/ui/tooltip'
import { NotFound } from '#/components/not-found'
import { getStorefrontSettingsServerFn } from '#/lib/server-settings'
import { useStorefrontSettings } from '#/lib/use-storefront-settings'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  loader: async () => {
    try {
      const settings = await getStorefrontSettingsServerFn().catch(() => null)
      return { settings }
    } catch {
      return { settings: null }
    }
  },
  head: ({ loaderData }) => {
    const faviconUrl =
      loaderData?.settings?.faviconUrl?.trim() || '/favicon.ico'
    const storeName = loaderData?.settings?.storeName?.trim() || 'SignovaPub'
    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          title: `${storeName} | Product Showcase`,
        },
        {
          name: 'description',
          content:
            loaderData?.settings?.storeDescription ||
            'Explore curated products and high-converting product showcases.',
        },
      ],
      links: [
        {
          rel: 'icon',
          href: faviconUrl,
        },
        {
          rel: 'stylesheet',
          href: appCss,
        },
      ],
    }
  },
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const loaderData = Route.useLoaderData()
  const { settings } = useStorefrontSettings(loaderData?.settings)

  // Dynamically update document favicon on client-side when changed
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const fav = settings?.faviconUrl?.trim() || '/favicon.ico'
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    if (link.getAttribute('href') !== fav) {
      link.href = fav
    }
  }, [settings?.faviconUrl])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
