<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { data, pending } = await useFetch<{
  stats: {
    usersCount: number
    familiesCount: number
    membersCount: number
    mediaCount: number
  }
  recentUsers: Array<{
    id: string
    name: string
    email: string
    image: string | null
    createdAt: string
  }>
  recentFamilies: Array<{
    id: string
    name: string
    slug: string
    createdAt: string
    ownerName: string | null
    ownerEmail: string | null
  }>
}>('/api/admin/stats', {
  credentials: 'include'
})

const statsItems = computed(() => {
  if (!data.value) return []
  return [
    { label: 'Total Pengguna', value: data.value.stats.usersCount, icon: 'i-lucide-users' },
    { label: 'Total Silsilah', value: data.value.stats.familiesCount, icon: 'i-lucide-git-fork' },
    { label: 'Total Anggota', value: data.value.stats.membersCount, icon: 'i-lucide-user-check' },
    { label: 'Total Media', value: data.value.stats.mediaCount, icon: 'i-lucide-image' }
  ]
})

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Overview Dashboard
      </h1>
      <p class="text-sm text-muted">
        Ringkasan data statistik sistem silsilah keluarga global secara real-time.
      </p>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <USkeleton v-for="i in 4" :key="i" class="h-24 w-full" />
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="stat in statsItems" :key="stat.label">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-muted">
              {{ stat.label }}
            </p>
            <p class="mt-2 text-3xl font-semibold text-highlighted">
              {{ stat.value }}
            </p>
          </div>
          <UIcon :name="stat.icon" class="size-7 text-primary" />
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Recent Users -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-highlighted">Pendaftaran Terbaru</h2>
            <UButton to="/admin/user-roles" size="xs" color="neutral" variant="subtle">Kelola Roles</UButton>
          </div>
        </template>

        <div v-if="pending" class="space-y-3 py-2">
          <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
        </div>
        <div v-else-if="!data?.recentUsers.length" class="text-sm text-muted text-center py-6">
          Belum ada pengguna terdaftar.
        </div>
        <div v-else class="divide-y divide-default">
          <div 
            v-for="user in data.recentUsers" 
            :key="user.id" 
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <UAvatar :src="user.image ?? undefined" :alt="user.name" size="sm" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-highlighted truncate">{{ user.name }}</p>
                <p class="text-[10px] text-muted truncate">{{ user.email }}</p>
              </div>
            </div>
            <span class="text-[10px] text-muted shrink-0">{{ formatDate(user.createdAt) }}</span>
          </div>
        </div>
      </UCard>

      <!-- Recent Families -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Silsilah Baru Dibuat</h2>
        </template>

        <div v-if="pending" class="space-y-3 py-2">
          <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
        </div>
        <div v-else-if="!data?.recentFamilies.length" class="text-sm text-muted text-center py-6">
          Belum ada silsilah keluarga yang dibuat.
        </div>
        <div v-else class="divide-y divide-default">
          <div 
            v-for="fam in data.recentFamilies" 
            :key="fam.id" 
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">{{ fam.name }}</p>
              <p class="text-[10px] text-muted truncate">Pemilik: {{ fam.ownerName || fam.ownerEmail || 'Unknown' }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[10px] text-muted">{{ formatDate(fam.createdAt) }}</p>
              <p class="text-[9px] text-primary mt-0.5">/{{ fam.slug }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
