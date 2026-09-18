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
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
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

