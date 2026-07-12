import { eq } from 'drizzle-orm'
import { user } from '../database/schema'
import { db } from './db'
import { auth } from './auth'

type H3Event = Parameters<Parameters<typeof defineEventHandler>[0]>[0]

export async function requireCurrentUser(event: H3Event) {
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

  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Anda harus login untuk mengakses resource ini.'
    })
  }

  const [dbUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  if (!dbUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Akun pengguna tidak ditemukan.'
    })
  }

  if (dbUser.status !== 'ACTIVE') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Akun pengguna tidak aktif.'
    })
  }

  return dbUser
}

export async function requireAdminUser(event: H3Event) {
  const currentUser = await requireCurrentUser(event)
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Hanya admin yang dapat mengakses resource ini.'
    })
  }
  return currentUser
}

