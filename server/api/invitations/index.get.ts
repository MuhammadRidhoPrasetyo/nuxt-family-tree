import { eq, and, isNull } from 'drizzle-orm'
import { invitations, families, user } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)

  const rows = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      expiredAt: invitations.expiredAt,
      createdAt: invitations.createdAt,
      familyName: families.name,
      inviterName: user.name
    })
    .from(invitations)
    .innerJoin(families, eq(invitations.familyId, families.id))
    .innerJoin(user, eq(invitations.invitedBy, user.id))
    .where(
      and(
        eq(invitations.email, currentUser.email),
        isNull(invitations.acceptedAt)
      )
    )

  return {
    invitations: rows
  }
})
