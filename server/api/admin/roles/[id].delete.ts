import { eq } from 'drizzle-orm'
import { roles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Role id is required' })
  }

  await db.delete(roles).where(eq(roles.id, id))
  return { success: true }
})
