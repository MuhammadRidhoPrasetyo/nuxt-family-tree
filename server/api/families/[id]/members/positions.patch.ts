import { familyMembers, familyUserRoles } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { requireCurrentUser } from '../../../../utils/session'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const PositionsSchema = z.object({
  positions: z.array(z.object({
    id: z.string().uuid(),
    x: z.number().int(),
    y: z.number().int()
  }))
})

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')

  if (!familyId) {
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
      message: 'Anda tidak memiliki akses untuk mengubah posisi di keluarga ini.'
    })
  }

  const body = await readValidatedBody(event, (data) => PositionsSchema.parse(data))

  for (const pos of body.positions) {
    await db
      .update(familyMembers)
      .set({
        positionX: pos.x,
        positionY: pos.y,
        updatedBy: user.id,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(familyMembers.id, pos.id),
          eq(familyMembers.familyId, familyId)
        )
      )
  }

  return { success: true }
})
