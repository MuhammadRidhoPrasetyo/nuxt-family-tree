import { eq, and, isNull } from 'drizzle-orm'
import { invitations, familyUserRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)
  const invitationId = getRouterParam(event, 'id')

  if (!invitationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID Undangan tidak valid.'
    })
  }

  // Find invitation
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.email, currentUser.email),
        isNull(invitations.acceptedAt)
      )
    )
    .limit(1)

  if (!invitation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Undangan tidak ditemukan atau sudah diterima.'
    })
  }

  // Check if invitation is expired
  if (new Date() > new Date(invitation.expiredAt)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Undangan ini sudah kedaluwarsa.'
    })
  }

  // Check if already has roles in familyUserRoles (safety check)
  const [existingRole] = await db
    .select()
    .from(familyUserRoles)
    .where(
      and(
        eq(familyUserRoles.familyId, invitation.familyId),
        eq(familyUserRoles.userId, currentUser.id)
      )
    )
    .limit(1)

  // Use transaction to ensure both invitation update and roles insert succeed
  await db.transaction(async (tx) => {
    // 1. Mark invitation as accepted
    await tx
      .update(invitations)
      .set({ acceptedAt: new Date() })
      .where(eq(invitations.id, invitationId))

    // 2. Add role if not already exists
    if (!existingRole) {
      await tx
        .insert(familyUserRoles)
        .values({
          familyId: invitation.familyId,
          userId: currentUser.id,
          role: invitation.role
        })
    }
  })

  return { success: true }
})
