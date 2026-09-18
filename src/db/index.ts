import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:bb5167858482@localhost:5432/signova'

export const db = drizzle(connectionString, { schema })
