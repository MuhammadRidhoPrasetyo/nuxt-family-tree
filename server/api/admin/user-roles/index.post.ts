import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { userRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)
  const result = assignRoleSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Input tidak valid.'
    })
  }

  // Delete existing roles for the user (assuming 1 main role for simplicity)
  await db.delete(userRoles).where(eq(userRoles.userId, result.data.userId))

  // Insert new role assignment
  const [newAssignment] = await db.insert(userRoles).values({
    userId: result.data.userId,
    roleId: result.data.roleId
  }).returning()

  return { userRole: newAssignment }
})
