import { and, eq } from 'drizzle-orm'
import { familyTreePreferences, familyUserRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Family ID tidak valid.'
    })
  }

  const roles = await db
    .select()
    .from(familyUserRoles)
    .where(
      and(
        eq(familyUserRoles.familyId, familyId),
        eq(familyUserRoles.userId, user.id)
      )
    )
    .limit(1)

  if (!roles[0]) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses ke keluarga ini.'
    })
  }

  let [preferences] = await db
    .select()
    .from(familyTreePreferences)
    .where(
      and(
        eq(familyTreePreferences.familyId, familyId),
        eq(familyTreePreferences.userId, user.id)
      )
    )
    .limit(1)

  if (!preferences) {
    [preferences] = await db
      .insert(familyTreePreferences)
      .values({ familyId, userId: user.id })
      .returning()
  }

  return { preferences }
})
