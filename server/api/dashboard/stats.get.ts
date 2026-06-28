import { and, eq, isNull, or, inArray, sql } from 'drizzle-orm'
import { families, familyUserRoles, familyMembers, invitations, mediaFiles } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)

  // 1. Get all unique families owned by or shared with the user
  const userFamilies = await db
    .select({ id: families.id })
    .from(families)
    .leftJoin(familyUserRoles, eq(families.id, familyUserRoles.familyId))
    .where(and(
      or(
        eq(families.ownerUserId, user.id),
        eq(familyUserRoles.userId, user.id)
      ),
      isNull(families.deletedAt)
    ))

  const uniqueFamilyIds = Array.from(new Set(userFamilies.map((f) => f.id)))
  const familiesCount = uniqueFamilyIds.length

  // 2. Count family members in those families
  let membersCount = 0
  if (uniqueFamilyIds.length > 0) {
    const membersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(familyMembers)
      .where(and(
        inArray(familyMembers.familyId, uniqueFamilyIds),
        isNull(familyMembers.deletedAt)
      ))
    membersCount = Number(membersResult[0]?.count || 0)
  }

  // 3. Count invitations for the current user (incoming pending ones)
  const invitationsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invitations)
    .where(and(
      eq(invitations.email, user.email),
      isNull(invitations.acceptedAt)
    ))
  const invitationsCount = Number(invitationsResult[0]?.count || 0)

  // 4. Count media files in those families
  let mediaCount = 0
  if (uniqueFamilyIds.length > 0) {
    const mediaResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaFiles)
      .where(inArray(mediaFiles.familyId, uniqueFamilyIds))
    mediaCount = Number(mediaResult[0]?.count || 0)
  }

  return {
    familiesCount,
    membersCount,
    invitationsCount,
    mediaCount
  }
})
