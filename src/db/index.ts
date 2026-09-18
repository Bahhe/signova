import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'

const connectionString = process.env.DATABASE_URL || ''

export const db = drizzle(connectionString, { schema })
