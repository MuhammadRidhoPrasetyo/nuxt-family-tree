import { eq } from 'drizzle-orm'
import { user } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event)
  const query = getQuery(event)
  const email = query.email as string

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Email harus diisi.'
    })
  }

  const [foundUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image
    })
    .from(user)
    .where(eq(user.email, email.trim()))
    .limit(1)

  return { user: foundUser || null }
})
