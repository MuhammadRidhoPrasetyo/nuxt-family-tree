import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { rolePermissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok, parseWithZod } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'

const assignPermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  action: z.enum(['assign', 'revoke'])
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const { roleId, permissionId, action } = parseWithZod(assignPermissionSchema, await readBody(event))

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

  return ok({ success: true })
})
