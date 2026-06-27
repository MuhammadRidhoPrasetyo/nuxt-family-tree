<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const toast = useToast()
const authClient = useAuthClient()
const loading = ref(false)
const form = reactive({
  email: '',
  password: ''
})

const login = async () => {
  loading.value = true

  const { error } = await authClient.signIn.email({
    email: form.email,
    password: form.password,
    callbackURL: '/dashboard'
  })

  loading.value = false

  if (error) {
    toast.add({ title: 'Login gagal', description: error.message, color: 'error' })
    return
  }

  await navigateTo('/dashboard')
}

const loginWithGoogle = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard'
  })
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-highlighted">
          Login
        </h1>
        <p class="text-sm text-muted">
          Masuk untuk membuka dashboard family tree.
        </p>
      </div>
    </template>

    <form class="space-y-4" @submit.prevent="login">
      <UFormField label="Email" name="email">
        <UInput v-model="form.email" type="email" icon="i-lucide-mail" required class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="form.password" type="password" icon="i-lucide-lock" required class="w-full" />
      </UFormField>

      <UButton type="submit" block :loading="loading">
        Login
      </UButton>
    </form>

    <USeparator label="atau" class="my-6" />

    <UButton color="neutral" variant="outline" block icon="i-simple-icons-google" @click="loginWithGoogle">
      Login with Google
    </UButton>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Belum punya akun?
        <ULink to="/register" class="font-medium text-primary">
          Register
        </ULink>
      </p>
    </template>
  </UCard>
</template>
