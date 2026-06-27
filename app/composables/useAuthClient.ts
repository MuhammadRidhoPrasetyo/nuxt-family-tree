import { createAuthClient } from 'better-auth/vue'

type AuthClient = ReturnType<typeof createAuthClient>

let authClient: AuthClient | null = null

export const useAuthClient = () => {
  const config = useRuntimeConfig()
  const betterAuthUrl = config.public.betterAuthUrl.replace(/\/$/, '')

  authClient ??= createAuthClient({
    baseURL: `${betterAuthUrl}/api/auth`
  })

  return authClient
}
