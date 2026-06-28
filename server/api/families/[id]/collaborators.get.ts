import { eq, and, isNull } from 'drizzle-orm'
import { familyUserRoles, user, invitations, families } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID Keluarga tidak valid.'
    })
  }

  // Check if family exists
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1)

  if (!family) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Keluarga tidak ditemukan.'
    })
  }

  // Check user role
  const roles = await db
    .select()
    .from(familyUserRoles)
    .where(
      and(
        eq(familyUserRoles.familyId, familyId),
        eq(familyUserRoles.userId, currentUser.id)
      )
    )
    .limit(1)

  const userRole = roles[0]
  const isOwner = family.ownerUserId === currentUser.id
  const isAdmin = userRole && (userRole.role === 'OWNER' || userRole.role === 'ADMIN')

  if (!isOwner && !isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki hak akses untuk mengelola kolaborator keluarga ini.'
    })
  }

  // Get active collaborators
  const activeCollabs = await db
    .select({
      id: familyUserRoles.id,
      userId: familyUserRoles.userId,
      role: familyUserRoles.role,
      name: user.name,
      email: user.email,
      image: user.image
    })
    .from(familyUserRoles)
    .innerJoin(user, eq(familyUserRoles.userId, user.id))
    .where(eq(familyUserRoles.familyId, familyId))

  const filteredActive = activeCollabs.filter((c) => c.userId !== family.ownerUserId)

  // Get pending invitations
  const pendingInvites = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.familyId, familyId),
        isNull(invitations.acceptedAt)
      )
    )

  return {
    active: filteredActive,
    pending: pendingInvites
  }
})
