<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

type User = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: string
}

const { data, pending } = await useFetch<{ users: User[] }>('/api/admin/users', {
  credentials: 'include',
  default: () => ({ users: [] })
})

const searchQuery = ref('')
const selectedRole = ref<string>('ALL')

const roleFilterItems = [
  { label: 'Semua Role', value: 'ALL' },
  { label: 'User', value: 'USER' },
  { label: 'Admin', value: 'ADMIN' }
]

const filteredUsers = computed(() => {
  let list = data.value?.users || []
  
  if (selectedRole.value !== 'ALL') {
    list = list.filter(u => u.role === selectedRole.value)
  }
  
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }
  
  return list
})

const roleBadgeColor = {
  USER: 'neutral',
  ADMIN: 'primary'
} as const

const statusBadgeColor = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  DELETED: 'error'
} as const

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Kelola Users
        </h1>
        <p class="text-sm text-muted">
          Daftar seluruh pengguna terdaftar, status akun, dan peran sistem global mereka.
        </p>
      </div>
    </div>

    <UCard>
      <!-- Filters Header -->
      <template #header>
        <div class="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
          <div class="w-full sm:max-w-xs">
            <UInput 
              v-model="searchQuery" 
              placeholder="Cari nama atau email..." 
              icon="i-lucide-search" 
              class="w-full"
            />
          </div>
          <div class="w-full sm:max-w-xs">
            <USelect 
              v-model="selectedRole" 
              :items="roleFilterItems" 
              class="w-full"
            />
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="pending" class="space-y-4 py-4">
        <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
      </div>

      <!-- Empty State -->
      <div v-else-if="!filteredUsers.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-users" class="mb-3 size-10 text-muted" />
        <h2 class="text-lg font-semibold text-highlighted">Tidak ada pengguna ditemukan</h2>
        <p class="mt-1 max-w-md text-sm text-muted">Coba ubah kata kunci pencarian atau filter peran Anda.</p>
      </div>

      <!-- Users List -->
      <div v-else class="divide-y divide-default">
        <div 
          v-for="user in filteredUsers" 
          :key="user.id" 
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
        >
          <!-- User Profile Details -->
          <div class="flex items-center gap-3 min-w-0">
            <UAvatar :src="user.image ?? undefined" :alt="user.name" size="md" />
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold text-highlighted truncate text-sm sm:text-base">{{ user.name }}</h3>
                <UBadge size="xs" :color="roleBadgeColor[user.role]" variant="subtle">
                  {{ user.role }}
                </UBadge>
                <UBadge size="xs" :color="statusBadgeColor[user.status]" variant="subtle">
                  {{ user.status }}
                </UBadge>
              </div>
              <p class="text-xs text-muted mt-0.5 truncate">{{ user.email }}</p>
            </div>
          </div>

          <!-- Account Metadata -->
          <div class="flex flex-row sm:flex-col justify-between sm:text-right shrink-0 gap-1 text-[11px] text-muted">
            <div>
              <span class="font-medium">Status Email:</span>
              <UBadge 
                size="xs" 
                :color="user.emailVerified ? 'success' : 'warning'" 
                variant="subtle"
                class="ml-1 px-1 h-auto"
              >
                {{ user.emailVerified ? 'Terverifikasi' : 'Belum Verifikasi' }}
              </UBadge>
            </div>
            <div>
              <span class="font-medium">Bergabung:</span> {{ formatDate(user.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
