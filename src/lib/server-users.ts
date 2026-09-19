import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'

export interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export const getUsersServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<UserRecord[]> => {
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers: headers as any })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw new Error('Forbidden: Administrator role required')
    }

    const { db } = await import('#/db/index')
    const { user } = await import('#/db/schema')

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))

    return users
  },
)

export const setUserRoleServerFn = createServerFn({ method: 'POST' })
  .validator((data: { userId: string; role: 'admin' | 'user' }) => data)
  .handler(async ({ data }) => {
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers: headers as any })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw new Error('Forbidden: Administrator role required')
    }

    // Safety check: prevent admin from demoting themselves if they are the only admin
    if (session.user.id === data.userId && data.role !== 'admin') {
      throw new Error('You cannot remove your own admin role.')
    }

    const { db } = await import('#/db/index')
    const { user } = await import('#/db/schema')

    await db
      .update(user)
      .set({ role: data.role, updatedAt: new Date() })
      .where(eq(user.id, data.userId))

    return { success: true, userId: data.userId, role: data.role }
  })

export const deleteUserServerFn = createServerFn({ method: 'POST' })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = getRequestHeaders()
    const session = await auth.api.getSession({ headers: headers as any })

    if (!session) {
      throw new Error('Unauthorized')
    }

    const role = (session.user as { role?: string }).role || 'user'
    if (role !== 'admin') {
      throw new Error('Forbidden: Administrator role required')
    }

    if (session.user.id === userId) {
      throw new Error('You cannot delete your own account.')
    }

    const { db } = await import('#/db/index')
    const { user } = await import('#/db/schema')

    await db.delete(user).where(eq(user.id, userId))

    return { success: true, userId }
  })
