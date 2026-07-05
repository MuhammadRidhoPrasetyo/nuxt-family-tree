import { createAuthClient } from 'better-auth/vue'

type AuthClient = ReturnType<typeof createAuthClient>

let authClient: AuthClient | null = null

export const useAuthClient = () => {
  const config = useRuntimeConfig()
  const origin = import.meta.client
    ? window.location.origin
    : config.public.betterAuthUrl.replace(/\/$/, '')

  authClient ??= createAuthClient({
    baseURL: `${origin}/api/auth`
  })

  return authClient
}
