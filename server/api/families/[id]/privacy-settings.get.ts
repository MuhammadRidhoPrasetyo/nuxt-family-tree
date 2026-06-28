import { privacySettings, familyUserRoles, families } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'
import { eq, and } from 'drizzle-orm'

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

  // Check user permissions in familyUserRoles
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

  const userRole = roles[0]

  if (!userRole) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses ke keluarga ini.'
    })
  }

  // Find or create privacy settings
  let [settings] = await db
    .select()
    .from(privacySettings)
    .where(eq(privacySettings.familyId, familyId))
    .limit(1)

  if (!settings) {
    [settings] = await db
      .insert(privacySettings)
      .values({
        familyId
      })
      .returning()
  }

  return {
    privacySettings: settings,
    isOwner: userRole.role === 'OWNER'
  }
})
