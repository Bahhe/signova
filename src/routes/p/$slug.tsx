import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getShopUrl } from '#/lib/domain'

export const Route = createFileRoute('/p/$slug')({
  component: RedirectToShopProduct,
})

function RedirectToShopProduct() {
  const { slug } = Route.useParams()

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(getShopUrl(`/${slug}`))
    }
  }, [slug])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-sm text-muted-foreground font-mono">
      Redirecting to product...
    </div>
  )
}
