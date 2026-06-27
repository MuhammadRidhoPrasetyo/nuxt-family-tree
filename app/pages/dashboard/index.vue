<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const currentUser = useCurrentUser()
const authClient = useAuthClient()
const toast = useToast()
const sendingVerification = ref(false)

const stats = [
  { label: 'Family tree', value: '0', icon: 'i-lucide-git-fork' },
  { label: 'Anggota', value: '0', icon: 'i-lucide-users' },
  { label: 'Undangan aktif', value: '0', icon: 'i-lucide-send' },
  { label: 'Media', value: '0', icon: 'i-lucide-images' }
]

const sendVerification = async () => {
  if (!currentUser.value?.email) {
    return
  }

  sendingVerification.value = true
  const { error } = await authClient.sendVerificationEmail({
    email: currentUser.value.email,
    callbackURL: '/dashboard'
  })
  sendingVerification.value = false

  if (error) {
    toast.add({ title: 'Gagal mengirim verifikasi', description: error.message, color: 'error' })
    return
  }

  toast.add({ title: 'Link verifikasi dikirim', description: 'Untuk mode development, link juga dicetak di log server.' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Dashboard
        </h1>
        <p class="text-sm text-muted">
          Ringkasan workspace family tree dan aktivitas terbaru.
        </p>
      </div>

      <UButton to="/families/create" icon="i-lucide-plus">
        Tambah Family Tree
      </UButton>
    </div>

    <UAlert
      v-if="currentUser && !currentUser.emailVerified"
      icon="i-lucide-mail-warning"
      color="warning"
      variant="subtle"
      title="Email belum diverifikasi"
      description="Akun yang dibuat dengan register biasa perlu verifikasi email sebelum fitur kolaborasi dan undangan dibuka penuh."
      :actions="[{ label: 'Kirim verifikasi', loading: sendingVerification, onClick: sendVerification }]"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="stat in stats" :key="stat.label">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted">
              {{ stat.label }}
            </p>
            <p class="mt-2 text-3xl font-semibold text-highlighted">
              {{ stat.value }}
            </p>
          </div>
          <UIcon :name="stat.icon" class="size-6 text-primary" />
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Selamat Datang di Family Tree!
          </h2>
        </template>
        <div class="prose prose-sm text-muted space-y-3">
          <p>
            Mulai kelola silsilah keluarga Anda dengan membuat family tree baru atau mengundang anggota keluarga lainnya untuk berkolaborasi.
          </p>
          <p>
            Gunakan tab navigasi di sebelah kiri untuk melihat daftar keluarga Anda, menambah anggota keluarga baru, atau mengelola undangan yang dikirim.
          </p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Aksi cepat
          </h2>
        </template>

        <div class="space-y-3">
          <UButton to="/families/create" icon="i-lucide-plus" block>
            Tambah Family Tree
          </UButton>
          <UButton to="/members" icon="i-lucide-user-plus" color="neutral" variant="outline" block>
            Tambah Anggota
          </UButton>
          <UButton to="/invitations" icon="i-lucide-send" color="neutral" variant="outline" block>
            Buat Undangan
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
