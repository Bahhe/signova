import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getShopUrl } from '#/lib/domain'

export const Route = createFileRoute('/p/')({
  component: RedirectToShopRoot,
})

function RedirectToShopRoot() {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.replace(getShopUrl('/'))
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-sm text-muted-foreground font-mono">
      Redirecting to shop...
    </div>
  )
}
