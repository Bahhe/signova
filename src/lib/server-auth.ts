import { createServerFn } from '@tanstack/react-start'

export const getSessionServerFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { auth } = await import('#/lib/auth')
      const { getRequestHeaders } = await import('@tanstack/react-start/server')
      const headers = getRequestHeaders()
      const session = await auth.api.getSession({
        headers: headers as any,
      })
      return session
    } catch (err) {
      console.error('Error getting session in getSessionServerFn:', err)
      return null
    }
  },
)
