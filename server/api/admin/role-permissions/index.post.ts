import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { rolePermissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

const assignPermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  action: z.enum(['assign', 'revoke'])
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)
  const result = assignPermissionSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Input tidak valid.'
    })
  }

  const { roleId, permissionId, action } = result.data

  if (action === 'assign') {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ))
      .limit(1)

    if (!existing) {
      await db.insert(rolePermissions).values({
        roleId,
        permissionId
      })
    }
  } else {
    await db
      .delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ))
  }

  return { success: true }
})
