import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { user } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'
import { ok, parseWithZod } from '../../utils/api'

const searchUserQuerySchema = z.object({
  email: z.string().trim().email().max(255)
})

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event)
  const query = parseWithZod(searchUserQuerySchema, getQuery(event))

  const [foundUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image
    })
    .from(user)
    .where(eq(user.email, query.email))
    .limit(1)

  return ok({ user: foundUser || null })
})
