import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { familyUserRoles, invitations, families } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

const RemoveCollabSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['ACTIVE', 'PENDING'])
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

  const body = await readValidatedBody(event, (data) => RemoveCollabSchema.parse(data))

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
      message: 'Anda tidak memiliki hak akses untuk menghapus kolaborator di keluarga ini.'
    })
  }

  if (body.type === 'ACTIVE') {
    // Delete active collaborator
    // Prevent owner from deleting themselves or being deleted (owner is filtered out of active list in GET, but add safeguard here)
    const [collab] = await db
      .select()
      .from(familyUserRoles)
      .where(eq(familyUserRoles.id, body.id))
      .limit(1)
    
    if (collab && collab.userId === family.ownerUserId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Tidak dapat menghapus pemilik keluarga.'
      })
    }

    const [deletedCollab] = await db
      .delete(familyUserRoles)
      .where(
        and(
          eq(familyUserRoles.id, body.id),
          eq(familyUserRoles.familyId, familyId)
        )
      )
      .returning()

    if (!deletedCollab) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: 'Kolaborator tidak ditemukan.'
      })
    }

    return { success: true }
  } else {
    // Delete pending invitation
    const [deletedInvite] = await db
      .delete(invitations)
      .where(
        and(
          eq(invitations.id, body.id),
          eq(invitations.familyId, familyId)
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
  }
})
