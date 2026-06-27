import { auth } from '../utils/auth'

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

  const user = session.user as typeof session.user & {
    role?: string
    status?: string
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      image: user.image ?? null,
      role: user.role ?? 'USER',
      status: user.status ?? 'ACTIVE'
    }
  }
})
