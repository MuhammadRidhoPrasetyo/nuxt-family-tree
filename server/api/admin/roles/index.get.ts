import { desc } from 'drizzle-orm'
import { roles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const list = await db.select().from(roles).orderBy(desc(roles.createdAt))
  return { roles: list }
})
