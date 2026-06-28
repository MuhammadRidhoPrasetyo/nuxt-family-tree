import { eq, and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { familyUserRoles, user, invitations, families } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER')
})

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

  const body = await readValidatedBody(event, (data) => InviteSchema.parse(data))

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

  // Check current user role
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

  const currentUserRole = roles[0]
  const isOwner = family.ownerUserId === currentUser.id
  const isAdmin = currentUserRole && (currentUserRole.role === 'OWNER' || currentUserRole.role === 'ADMIN')

  if (!isOwner && !isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki hak akses untuk mengundang kolaborator ke keluarga ini.'
    })
  }

  // Find target user by email
  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, body.email))
    .limit(1)

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'User tidak ditemukan.'
    })
  }

  if (targetUser.id === family.ownerUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'User ini adalah pemilik keluarga ini.'
    })
  }

  // Check if user is already an active collaborator
  const [existingRole] = await db
    .select()
    .from(familyUserRoles)
    .where(
      and(
        eq(familyUserRoles.familyId, familyId),
        eq(familyUserRoles.userId, targetUser.id)
      )
    )
    .limit(1)

  if (existingRole) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'User ini sudah menjadi kolaborator keluarga ini.'
    })
  }

  // Check if there is already a pending invitation
  const [existingInvite] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.familyId, familyId),
        eq(invitations.email, body.email),
        isNull(invitations.acceptedAt)
      )
    )
    .limit(1)

  if (existingInvite) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Undangan untuk user ini sedang tertunda.'
    })
  }

  // Create invitation
  const token = crypto.randomUUID()
  const expiredAt = new Date()
  expiredAt.setDate(expiredAt.getDate() + 7) // 7 days expiration

  const [invitation] = await db
    .insert(invitations)
    .values({
      familyId,
      email: body.email,
      token,
      role: body.role,
      invitedBy: currentUser.id,
      expiredAt
    })
    .returning()

  return { invitation }
})
