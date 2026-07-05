<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const toast = useToast()
const authClient = useAuthClient()
const loading = ref(false)
const form = reactive({
  name: '',
  email: '',
  password: ''
})

const register = async () => {
  loading.value = true

  try {
    const { error } = await authClient.signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
      callbackURL: '/dashboard'
    })

    if (error) {
      toast.add({ title: 'Register gagal', description: error.message, color: 'error' })
      return
    }

    await navigateTo('/dashboard')
  } catch (error: any) {
    toast.add({
      title: 'Register gagal',
      description: error?.message || 'Server auth tidak merespons.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const registerWithGoogle = async () => {
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
          Register
        </h1>
        <p class="text-sm text-muted">
          Buat akun baru untuk mulai membangun family tree.
        </p>
      </div>
    </template>

    <UButton color="neutral" variant="outline" block icon="i-simple-icons-google" @click="registerWithGoogle">
      Register with Google
    </UButton>

    <USeparator label="atau daftar biasa" class="my-6" />

    <form class="space-y-4" @submit.prevent="register">
      <UFormField label="Nama" name="name">
        <UInput v-model="form.name" icon="i-lucide-user" required class="w-full" />
      </UFormField>

      <UFormField label="Email" name="email">
        <UInput v-model="form.email" type="email" icon="i-lucide-mail" required class="w-full" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput v-model="form.password" type="password" icon="i-lucide-lock" required minlength="8" class="w-full" />
      </UFormField>

      <UButton type="submit" block :loading="loading">
        Register
      </UButton>
    </form>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Sudah punya akun?
        <ULink to="/login" class="font-medium text-primary">
          Login
        </ULink>
      </p>
    </template>
  </UCard>
</template>
