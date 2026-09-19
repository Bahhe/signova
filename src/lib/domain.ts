/**
 * Domain and subdomain utilities for Signova
 * 
 * Main Domain: domain.com (or localhost:3000)
 * - / -> Landing page placeholder (empty for now)
 * - /dashboard -> Admin Studio / Dashboard
 * - /dashboard/settings -> Settings
 * - /dashboard/users -> User management
 * - /login -> Sign in
 * - /unauthorized -> Access denied
 * 
 * Shop Subdomain: shop.domain.com (or shop.localhost:3000)
 * - / -> Product showcase (formerly /p)
 * - /$slug -> Product detail page (formerly /p/$slug)
 * - /thank-you -> Order confirmation
 */

export function isShopDomain(hostname?: string, search?: string): boolean {
  if (typeof window !== 'undefined') {
    const currentHost = (hostname || window.location.hostname || '').toLowerCase()
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
    const h = hostname.toLowerCase()
    return h.startsWith('shop.') || h === 'shop' || h.includes('.shop.')
  }

  return false
}

/**
 * Returns the base URL for the shop subdomain
 * e.g. http://shop.localhost:3000 or https://shop.domain.com
 */
export function getShopBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  const { hostname, port, protocol } = window.location

  // If already on shop subdomain, return current origin
  if (isShopDomain(hostname)) {
    return window.location.origin
  }

  // Handle localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//shop.localhost${port ? `:${port}` : ''}`
  }

  // Production domain: prepend "shop."
  return `${protocol}//shop.${hostname}${port ? `:${port}` : ''}`
}

/**
 * Returns the base URL for the main domain
 * e.g. http://localhost:3000 or https://domain.com
 */
export function getMainBaseUrl(): string {
  if (typeof window === 'undefined') return ''
  const { hostname, port, protocol } = window.location

  // If currently on shop subdomain, remove the "shop." prefix
  if (hostname.startsWith('shop.')) {
    const mainHost = hostname.replace(/^shop\./, '')
    return `${protocol}//${mainHost}${port ? `:${port}` : ''}`
  }

  return window.location.origin
}

/**
 * Generates an absolute or relative link to a shop page
 * Automatically switches to shop subdomain if called from main domain
 */
export function getShopUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (typeof window === 'undefined') return cleanPath

  if (isShopDomain()) {
    return cleanPath
  }

  return `${getShopBaseUrl()}${cleanPath}`
}

/**
 * Generates an absolute or relative link to a main domain page (e.g. /dashboard)
 * Automatically switches to main domain if called from shop subdomain
 */
export function getMainUrl(path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (typeof window === 'undefined') return cleanPath

  if (!isShopDomain()) {
    return cleanPath
  }

  return `${getMainBaseUrl()}${cleanPath}`
}
