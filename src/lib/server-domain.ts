import { createServerFn } from '@tanstack/react-start'
import { isShopDomain } from './domain'

export interface HostContext {
  host: string
  hostname: string
  subdomain: string | null
  isShop: boolean
}

export const getHostContextServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<HostContext> => {
    try {
      const { getRequestHeaders, getRequestHost } = await import(
        '@tanstack/react-start/server'
      )
      const headers = (getRequestHeaders() || {}) as unknown as Record<
        string,
        string | string[] | undefined
      >

      // Look for forwarded host first (standard behind reverse proxies/CDNs like Cloudflare, Nginx, Coolify)
      const forwardedHost =
        (headers['x-forwarded-host'] as string) ||
        (headers['x-original-host'] as string) ||
        (headers['x-forwarded-server'] as string) ||
        ''

      let rawHost = ''
      if (forwardedHost) {
        rawHost = forwardedHost
      } else if (typeof getRequestHost === 'function') {
        rawHost = getRequestHost({ xForwardedHost: true }) || ''
      }
      if (!rawHost) {
        rawHost = (headers['host'] as string) || ''
      }

      if (Array.isArray(rawHost)) rawHost = rawHost[0] || ''
      // If multiple comma-separated proxies exist, take the first client host
      const primaryHost = (rawHost || '').split(',')[0].trim()
      const hostname = primaryHost.split(':')[0].toLowerCase()

      const isShop = isShopDomain(hostname)

      return {
        host: primaryHost,
        hostname,
        subdomain: isShop ? 'shop' : null,
        isShop,
      }
    } catch (err) {
      console.error('Error determining host in getHostContextServerFn:', err)
      return {
        host: '',
        hostname: '',
        subdomain: null,
        isShop: false,
      }
    }
  },
)
