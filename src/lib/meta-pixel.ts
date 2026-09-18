/**
 * Meta Pixel (Facebook Pixel) Utility and Tracking Helpers
 */

declare global {
  interface Window {
    fbq?: any
    _fbq?: any
  }
}

const initializedPixels = new Set<string>()

/**
 * Initialize Meta Pixel script dynamically in the browser
 */
export function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return
  const cleanId = pixelId?.trim()
  if (!cleanId) return

  if (initializedPixels.has(cleanId)) {
    return
  }

  // Define fbq function if not already present
  if (!window.fbq) {
    const fbq: any = function (...args: any[]) {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, args)
      } else {
        fbq.queue.push(args)
      }
    }
    window.fbq = fbq
    if (!window._fbq) window._fbq = fbq
    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []

    // Inject external script
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    const firstScript = document.getElementsByTagName('script')[0]
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript)
    } else {
      document.head.appendChild(script)
    }
  }

  try {
    window.fbq('init', cleanId)
    initializedPixels.add(cleanId)
    console.info(`[Meta Pixel] Initialized pixel ID: ${cleanId}`)
  } catch (err) {
    console.error('[Meta Pixel] Error initializing pixel:', err)
  }
}

/**
 * Track an event using Meta Pixel
 */
export function trackPixelEvent(
  eventName: string,
  params?: Record<string, any>,
): void {
  if (typeof window === 'undefined') return

  if (window.fbq) {
    try {
      if (params) {
        window.fbq('track', eventName, params)
        console.debug(`[Meta Pixel] Event tracked: ${eventName}`, params)
      } else {
        window.fbq('track', eventName)
        console.debug(`[Meta Pixel] Event tracked: ${eventName}`)
      }
    } catch (err) {
      console.warn(`[Meta Pixel] Failed to track event ${eventName}:`, err)
    }
  } else {
    // If fbq is not ready yet, retry briefly
    setTimeout(() => {
      if (window.fbq) {
        try {
          if (params) {
            window.fbq('track', eventName, params)
          } else {
            window.fbq('track', eventName)
          }
        } catch {
          // ignore
        }
      }
    }, 500)
  }
}

/**
 * Track PageView event
 */
export function trackPageView(params?: Record<string, any>): void {
  trackPixelEvent('PageView', params)
}

/**
 * Track ViewContent event (Product view)
 */
export function trackViewContent(params: {
  content_name?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
}): void {
  trackPixelEvent('ViewContent', {
    content_type: 'product',
    currency: 'DZD',
    ...params,
  })
}

/**
 * Track Purchase event
 */
export function trackPurchase(params: {
  value: number
  currency?: string
  content_name?: string
  content_ids?: string[]
  content_type?: string
  num_items?: number
  order_id?: string
}): void {
  trackPixelEvent('Purchase', {
    currency: 'DZD',
    content_type: 'product',
    ...params,
  })
}

/**
 * Extract clean numeric price from formatted price string (e.g. "4,500 DZD" -> 4500)
 */
export function parseNumericPrice(priceStr?: string | number): number {
  if (typeof priceStr === 'number') return priceStr
  if (!priceStr) return 0
  const clean = priceStr.toString().replace(/[^\d.]/g, '')
  const parsed = parseFloat(clean)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Validate Meta Pixel ID (typically 12-18 digits)
 */
export function isValidPixelId(pixelId?: string): boolean {
  if (!pixelId) return false
  const trimmed = pixelId.trim()
  return /^\d{8,20}$/.test(trimmed)
}
