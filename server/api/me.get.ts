import { eq } from 'drizzle-orm'
import { user } from '../database/schema'
import { auth } from '../utils/auth'
import { db } from '../utils/db'

export default defineEventHandler(async (event) => {
  const headers = new Headers()

  for (const [key, value] of Object.entries(event.node.req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item)
      }
    } else if (value) {
      headers.set(key, value)
    }
  }

  const session = await auth.api.getSession({
    headers
  })

  if (!session?.user) {
    return { user: null }
  }

  const [dbUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      status: user.status
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!dbUser) {
    return { user: null }
  }

  if (dbUser.status !== 'ACTIVE') {
    return { user: null }
  }

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      emailVerified: Boolean(dbUser.emailVerified),
      image: dbUser.image ?? null,
      role: dbUser.role,
      status: dbUser.status
    }
  }
})
