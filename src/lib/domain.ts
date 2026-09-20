/**
 * Domain and subdomain utilities for Signova
 * 
 * Main Domain: signovapub.com (or localhost:3000)
 * - / -> Landing page placeholder
 * - /dashboard -> Admin Studio / Dashboard
 * - /dashboard/settings -> Settings
 * - /dashboard/users -> User management
 * - /login -> Sign in
 * - /unauthorized -> Access denied
 * 
 * Shop Subdomain: shop.signovapub.com (or shop.localhost:3000)
 * - / -> Product showcase (formerly /p)
 * - /$slug -> Product detail page (formerly /p/$slug)
 * - /thank-you -> Order confirmation
 */

export const DEFAULT_PRODUCTION_DOMAIN = 'signovapub.com'

export function getProductionDomain(): string {
  if (typeof process !== 'undefined' && process.env?.APP_DOMAIN) {
    return process.env.APP_DOMAIN.trim()
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_DOMAIN) {
    return (import.meta.env.VITE_APP_DOMAIN as string).trim()
  }
  return DEFAULT_PRODUCTION_DOMAIN
}

export function isShopDomain(hostname?: string, search?: string): boolean {
  if (typeof window !== 'undefined') {
    const rawHost = (hostname || window.location.hostname || '').toLowerCase()
    const currentHost = rawHost.split(':')[0]
    const currentSearch = search !== undefined ? search : window.location.search

    // Query parameter override for easy testing in local dev: ?subdomain=shop
    if (currentSearch) {
      try {
        const params = new URLSearchParams(currentSearch)
        if (params.get('subdomain') === 'shop') return true
      } catch {
        // ignore search parse error
      }
    }

    if (
      currentHost.startsWith('shop.') ||
      currentHost === 'shop' ||
      currentHost.includes('.shop.')
    ) {
      return true
    }
    return false
  }

  if (hostname) {
    const h = hostname.toLowerCase().split(':')[0]
    return h.startsWith('shop.') || h === 'shop' || h.includes('.shop.')
  }

  return false
}

/**
 * Returns the base URL for the shop subdomain
 * e.g. http://shop.localhost:3000 or https://shop.signovapub.com
 */
export function getShopBaseUrl(currentHostname?: string): string {
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location
    const rawHost = (currentHostname || hostname || '').toLowerCase()
    const host = rawHost.split(':')[0]

    // If already on shop subdomain, return current origin
    if (isShopDomain(host)) {
      return window.location.origin
    }

    // Handle localhost development
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
      return `${protocol}//shop.localhost${port ? `:${port}` : ''}`
    }

    // Production / custom domain: strip leading "www." if present
    const cleanHost = host.replace(/^www\./, '')
    return `${protocol}//shop.${cleanHost}${port ? `:${port}` : ''}`
  }

  // Server-side (SSR) fallback
  const isDev =
    typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  if (isDev) {
    return 'http://shop.localhost:3000'
  }

  const domain = getProductionDomain().replace(/^www\./, '')
  return `https://shop.${domain}`
}

/**
 * Returns the base URL for the main domain
 * e.g. http://localhost:3000 or https://signovapub.com
 */
export function getMainBaseUrl(currentHostname?: string): string {
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location
    const rawHost = (currentHostname || hostname || '').toLowerCase()
    const host = rawHost.split(':')[0]

    // If currently on shop subdomain, remove the "shop." prefix
    if (host.startsWith('shop.')) {
      const mainHost = host.replace(/^shop\./, '')
      return `${protocol}//${mainHost}${port ? `:${port}` : ''}`
    }

    if (host === 'shop') {
      return `${protocol}//localhost${port ? `:${port}` : ''}`
    }

    return window.location.origin
  }

  // Server-side (SSR) fallback
  const isDev =
    typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  if (isDev) {
    return 'http://localhost:3000'
  }

  const domain = getProductionDomain().replace(/^www\./, '')
  return `https://${domain}`
}

/**
 * Generates an absolute or relative link to a shop page
 * Automatically switches to shop subdomain if called from main domain
 */
export function getShopUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // On client, if already on shop subdomain, return clean relative path
  if (typeof window !== 'undefined' && isShopDomain()) {
    return cleanPath
  }

  // On main domain (or during SSR on main domain), always generate absolute shop URL
  return `${getShopBaseUrl()}${cleanPath}`
}

/**
 * Generates an absolute or relative link to a main domain page (e.g. /dashboard)
 * Automatically switches to main domain if called from shop subdomain
 */
export function getMainUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // On client, if already on main domain, return clean relative path
  if (typeof window !== 'undefined' && !isShopDomain()) {
    return cleanPath
  }

  // On shop subdomain (or during SSR on shop subdomain), always generate absolute main URL
  return `${getMainBaseUrl()}${cleanPath}`
}
