import { desc } from 'drizzle-orm'
import { permissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const list = await db.select().from(permissions).orderBy(desc(permissions.createdAt))
  return { permissions: list }
})
