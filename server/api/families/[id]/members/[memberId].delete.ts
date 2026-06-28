import { familyMembers, familyUserRoles, parentChildRelations, marriages } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { requireCurrentUser } from '../../../../utils/session'
import { eq, and, or } from 'drizzle-orm'
import { logAction } from '../../../../utils/audit'

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

  if (!userRole || (userRole.role !== 'OWNER' && userRole.role !== 'ADMIN' && userRole.role !== 'EDITOR')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses untuk menghapus anggota di keluarga ini.'
    })
  }

  // Get the old member data for audit logs
  const [oldMember] = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.id, memberId),
        eq(familyMembers.familyId, familyId)
      )
    )
    .limit(1)

  if (!oldMember) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Anggota keluarga tidak ditemukan.'
    })
  }

  // Soft delete member
  const [deletedMember] = await db
    .update(familyMembers)
    .set({
      deletedAt: new Date(),
      updatedBy: user.id,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(familyMembers.id, memberId),
        eq(familyMembers.familyId, familyId)
      )
    )
    .returning()

  // Clean up relations involving this member
  await db
    .delete(parentChildRelations)
    .where(
      and(
        eq(parentChildRelations.familyId, familyId),
        or(
          eq(parentChildRelations.parentId, memberId),
          eq(parentChildRelations.childId, memberId)
        )
      )
    )

  await db
    .delete(marriages)
    .where(
      and(
        eq(marriages.familyId, familyId),
        or(
          eq(marriages.partner1Id, memberId),
          eq(marriages.partner2Id, memberId)
        )
      )
    )

  // Log action
  await logAction(event, {
    userId: user.id,
    familyId,
    action: 'DELETE_MEMBER',
    tableName: 'family_members',
    recordId: memberId,
    oldValue: oldMember,
    newValue: null
  })

  return { success: true, member: deletedMember }
})
