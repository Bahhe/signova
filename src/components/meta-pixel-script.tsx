import * as React from 'react'
import { initMetaPixel, trackPageView } from '#/lib/meta-pixel'

interface MetaPixelScriptProps {
  pixelId?: string | null
}

export function MetaPixelScript({ pixelId }: MetaPixelScriptProps) {
  React.useEffect(() => {
    if (!pixelId || !pixelId.trim()) return

    // Initialize pixel
    initMetaPixel(pixelId)
    trackPageView()
  }, [pixelId])

  if (!pixelId || !pixelId.trim()) {
    return null
  }

  const cleanId = pixelId.trim()

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${cleanId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}
