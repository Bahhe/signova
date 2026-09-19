import { createServerFn } from '@tanstack/react-start'

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
      const headers = getRequestHeaders() as unknown as Record<
        string,
        string | string[] | undefined
      >
      let host =
        (typeof getRequestHost === 'function' ? getRequestHost() : '') ||
        (headers['x-forwarded-host'] as string) ||
        (headers['host'] as string) ||
        ''

      if (Array.isArray(host)) host = host[0]
      const hostname = (host || '').split(':')[0].toLowerCase()

      const isShop =
        hostname.startsWith('shop.') ||
        hostname === 'shop' ||
        hostname.includes('.shop.')

      return {
        host,
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
