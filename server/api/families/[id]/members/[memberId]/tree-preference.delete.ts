import { and, eq } from 'drizzle-orm'
import { familyTreeNodePreferences, familyUserRoles } from '../../../../../database/schema'
import { db } from '../../../../../utils/db'
import { requireCurrentUser } from '../../../../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!familyId || !memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID tidak valid.'
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

  await db
    .delete(familyTreeNodePreferences)
    .where(
      and(
        eq(familyTreeNodePreferences.familyId, familyId),
        eq(familyTreeNodePreferences.userId, user.id),
        eq(familyTreeNodePreferences.memberId, memberId)
      )
    )

  return { success: true }
})
