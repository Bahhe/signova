import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/users')({
  beforeLoad: async () => {
    throw redirect({
      to: '/dashboard/users',
    })
  },
})
