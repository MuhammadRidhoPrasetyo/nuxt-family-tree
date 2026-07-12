import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { userRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok, parseWithZod } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'

const assignRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = parseWithZod(assignRoleSchema, await readBody(event))

  // Delete existing roles for the user (assuming 1 main role for simplicity)
  await db.delete(userRoles).where(eq(userRoles.userId, body.userId))

  // Insert new role assignment
  const [newAssignment] = await db.insert(userRoles).values({
    userId: body.userId,
    roleId: body.roleId
  }).returning()

  return ok({ userRole: newAssignment })
})
