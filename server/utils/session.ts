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

  return session.user
}

export async function requireAdminUser(event: H3Event) {
  const user = await requireCurrentUser(event) as any
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Hanya admin yang dapat mengakses resource ini.'
    })
  }
  return user
}


