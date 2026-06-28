import { auditLogs, familyUserRoles, user } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'
import { eq, and, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Family ID tidak valid.'
    })
  }

  // Check user permissions in familyUserRoles (anyone authorized in this family can view the logs)
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

  if (!userRole) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses ke log keluarga ini.'
    })
  }

  // Query audit logs joining with user information
  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      tableName: auditLogs.tableName,
      recordId: auditLogs.recordId,
      oldValue: auditLogs.oldValue,
      newValue: auditLogs.newValue,
      createdAt: auditLogs.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      }
    })
    .from(auditLogs)
    .leftJoin(user, eq(auditLogs.userId, user.id))
    .where(eq(auditLogs.familyId, familyId))
    .orderBy(desc(auditLogs.createdAt))

  return { logs }
})
