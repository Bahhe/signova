import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionServerFn } from '#/lib/server-auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: '/' } })
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw redirect({ to: '/p' })
    }
    throw redirect({ to: '/' })
  },
})
