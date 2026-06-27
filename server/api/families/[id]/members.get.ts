import { eq, and, isNull } from 'drizzle-orm'
import { familyMembers, familyUserRoles, parentChildRelations, marriages } from '../../../database/schema'
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

  const members = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        isNull(familyMembers.deletedAt)
      )
    )

  const relations = await db
    .select()
    .from(parentChildRelations)
    .where(eq(parentChildRelations.familyId, familyId))

  const marriageList = await db
    .select()
    .from(marriages)
    .where(eq(marriages.familyId, familyId))

  return {
    members,
    relations,
    marriages: marriageList
  }
})
