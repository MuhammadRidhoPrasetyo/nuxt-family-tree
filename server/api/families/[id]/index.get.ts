import { and, eq, isNull, or } from 'drizzle-orm'
import { families, familyUserRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Family id is required' })
  }

  const [family] = await db
    .select({
      id: families.id,
      name: families.name,
      slug: families.slug,
      description: families.description,
      visibility: families.visibility,
      ownerUserId: families.ownerUserId,
      createdAt: families.createdAt,
      updatedAt: families.updatedAt
    })
    .from(families)
    .leftJoin(familyUserRoles, eq(families.id, familyUserRoles.familyId))
    .where(and(
      eq(families.id, id),
      or(
        eq(families.ownerUserId, user.id),
        eq(familyUserRoles.userId, user.id)
      ),
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
