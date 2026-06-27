import { roles, permissions, rolePermissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const roleList = await db.select().from(roles)
  const permissionList = await db.select().from(permissions)
  const mappingList = await db.select().from(rolePermissions)

  return {
    roles: roleList,
    permissions: permissionList,
    mappings: mappingList
  }
})
