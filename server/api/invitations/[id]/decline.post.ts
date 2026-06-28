import { eq, and, isNull } from 'drizzle-orm'
import { invitations } from '../../../database/schema'
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

  // Delete invitation
  const [deletedInvite] = await db
    .delete(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.email, currentUser.email),
        isNull(invitations.acceptedAt)
      )
    )
    .returning()

  if (!deletedInvite) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Undangan tidak ditemukan.'
    })
  }

  return { success: true }
})
