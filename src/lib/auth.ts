import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { admin } from 'better-auth/plugins'
import { db } from '../db/index'
import * as schema from '../db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    '36d61fb63ddc9e0fd7b017cfaa264be5ad6c24533fd3e633cf1d0e65f3364f40',
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.NODE_ENV === 'production'
      ? undefined
      : 'http://localhost:3000'),
  trustedOrigins: async (request) => {
    const origins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
    ]
    if (process.env.BETTER_AUTH_URL) {
      origins.push(process.env.BETTER_AUTH_URL)
    }
    if (process.env.APP_URL) {
      origins.push(process.env.APP_URL)
    }
    const origin = request?.headers.get('origin')
    if (origin) {
      origins.push(origin)
    }
    const host =
      request?.headers.get('x-forwarded-host') || request?.headers.get('host')
    const proto = request?.headers.get('x-forwarded-proto') || 'https'
    if (host) {
      origins.push(`${proto}://${host}`)
    }
    return origins
  },
  advanced: {
    trustedProxyHeaders: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    tanstackStartCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
