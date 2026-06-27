import { eq } from 'drizzle-orm'
import { permissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Permission id is required' })
  }

  await db.delete(permissions).where(eq(permissions.id, id))
  return { success: true }
})
