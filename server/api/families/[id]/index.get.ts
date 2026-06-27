import { and, eq, isNull } from 'drizzle-orm'
import { families } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Family id is required' })
  }

  const [family] = await db
    .select()
    .from(families)
    .where(and(
      eq(families.id, id),
      eq(families.ownerUserId, user.id),
      isNull(families.deletedAt)
    ))
    .limit(1)

  if (!family) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Family not found',
      message: 'Family tree tidak ditemukan.'
    })
  }

  return { family }
})
