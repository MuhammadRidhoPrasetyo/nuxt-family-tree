import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../utils/db'

const HealthSchema = z.object({
  ok: z.literal(true),
  checkedAt: z.string()
})

export default defineEventHandler(async () => {
  await db.execute(sql`select 1`)

  return HealthSchema.parse({
    ok: true,
    checkedAt: new Date().toISOString()
  })
})
