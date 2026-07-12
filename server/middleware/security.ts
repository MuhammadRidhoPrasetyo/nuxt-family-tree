const buckets = new Map<string, { count: number, resetAt: number }>()

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getClientKey(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]) {
  return (
    getRequestIP(event, { xForwardedFor: true }) ||
    event.node.req.socket.remoteAddress ||
    'unknown'
  )
}

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  current.count += 1
  if (current.count > limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Terlalu banyak request. Coba lagi beberapa saat.'
    })
  }
}

export default defineEventHandler((event) => {
  setHeader(event, 'x-content-type-options', 'nosniff')
  setHeader(event, 'x-frame-options', 'DENY')
  setHeader(event, 'referrer-policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'permissions-policy', 'camera=(), microphone=(), geolocation=()')

  const method = getMethod(event)
  const path = event.path.split('?')[0]
  const clientKey = getClientKey(event)

  if (path.startsWith('/api/auth')) {
    checkRateLimit(`auth:${clientKey}`, 30, 60 * 1000)
  } else if (path.includes('/upload')) {
    checkRateLimit(`upload:${clientKey}`, 20, 60 * 1000)
  } else if (path.startsWith('/api/admin')) {
    checkRateLimit(`admin:${clientKey}`, 120, 60 * 1000)
  }

  if (!mutatingMethods.has(method)) {
    return
  }

  const origin = getHeader(event, 'origin')
  if (!origin) {
    return
  }

  const config = useRuntimeConfig()
  const requestUrl = getRequestURL(event)
  const allowedOrigins = new Set([
    requestUrl.origin,
    config.public.betterAuthUrl?.replace(/\/$/, ''),
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || '')
      .split(',')
      .map(value => value.trim().replace(/\/$/, ''))
      .filter(Boolean)
  ])

  if (!allowedOrigins.has(origin.replace(/\/$/, ''))) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Origin request tidak diizinkan.'
    })
  }
})

