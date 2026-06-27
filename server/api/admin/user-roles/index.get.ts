import { eq } from 'drizzle-orm'
import { user, userRoles, roles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const userList = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: roles.id,
      roleName: roles.name
    })
    .from(user)
    .leftJoin(userRoles, eq(user.id, userRoles.userId))
    .leftJoin(roles, eq(userRoles.roleId, roles.id))

  const roleList = await db.select().from(roles)

  return {
    users: userList,
    roles: roleList
  }
})
