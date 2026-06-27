export type CurrentUser = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: string
  status: string
}

export const useCurrentUser = () => useState<CurrentUser | null>('current-user', () => null)
