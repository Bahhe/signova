import { createServerFn } from '@tanstack/react-start'
import type { StorefrontSettings } from './types.ts'

// TanStack Start Server Functions for Storefront Settings
export const getStorefrontSettingsServerFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { getStorefrontSettings } = await import('#/server/db-settings')
  return getStorefrontSettings()
})

export const saveStorefrontSettingsServerFn = createServerFn({ method: 'POST' })
  .validator((settings: Partial<StorefrontSettings>) => settings)
  .handler(async ({ data: settings }) => {
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers: headers as any })
    if (!session) {
      throw new Error('Unauthorized: You must be signed in to modify settings')
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw new Error(
        'Forbidden: Administrator role required to modify storefront settings',
      )
    }
    const { updateStorefrontSettings } = await import('#/server/db-settings')
    return updateStorefrontSettings(settings)
  })
