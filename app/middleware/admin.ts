export default defineNuxtRouteMiddleware(async () => {
  const currentUser = useCurrentUser()

  if (!currentUser.value) {
    const { data } = await useFetch<{ user: CurrentUser | null }>('/api/me', {
      credentials: 'include'
    })
    currentUser.value = data.value?.user ?? null
  }

  if (!currentUser.value) {
    return navigateTo('/login')
  }

  if (currentUser.value.role !== 'ADMIN' && currentUser.value.role !== 'SUPER_ADMIN') {
    return navigateTo('/dashboard')
  }
})
