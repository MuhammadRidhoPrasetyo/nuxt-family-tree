import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../database/schema'

const config = useRuntimeConfig()
const databaseUrl = config.databaseUrl

export const pool = new Pool({
  connectionString: getDatabaseUrl(databaseUrl),
  connectionTimeoutMillis: 5000
})

export const db = drizzle(pool, { schema })

function getDatabaseUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database is not configured',
      message: 'DATABASE_URL is missing. Copy .env.example to .env and set a valid PostgreSQL connection string.'
    })
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database is not configured',
      message: 'DATABASE_URL must be a valid PostgreSQL connection string, for example postgres://user:password@localhost:5432/family_tree.'
    })
  }

  if (!url.password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database is not configured',
      message: 'DATABASE_URL must include a database password, for example postgres://user:password@localhost:5432/family_tree.'
    })
  }

  return value
}
