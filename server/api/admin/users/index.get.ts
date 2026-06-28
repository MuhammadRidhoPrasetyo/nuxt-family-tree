import { desc } from 'drizzle-orm'
import { user } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const list = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt
    })
    .from(user)
    .orderBy(desc(user.createdAt))

  return { users: list }
})
