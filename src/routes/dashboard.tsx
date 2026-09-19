import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSessionServerFn } from '#/lib/server-auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionServerFn()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      })
    }
    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw redirect({ to: '/unauthorized' })
    }
    return { session }
  },
  component: () => <Outlet />,
})
