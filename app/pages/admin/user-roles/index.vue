<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

type UserWithRole = {
  id: string
  name: string
  email: string
  roleId: string | null
  roleName: string | null
}

type Role = {
  id: string
  name: string
}

const toast = useToast()
const updatingId = ref<string | null>(null)

const { data, pending, refresh } = await useFetch<{ users: UserWithRole[], roles: Role[] }>('/api/admin/user-roles', {
  credentials: 'include',
  default: () => ({ users: [], roles: [] })
})

const changeRole = async (userId: string, roleId: string) => {
  updatingId.value = userId

  try {
    await $fetch('/api/admin/user-roles', {
      method: 'POST',
      body: { userId, roleId },
      credentials: 'include'
    })
    toast.add({ title: 'Role pengguna berhasil diperbarui' })
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui role.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Kelola User Roles
      </h1>
      <p class="text-sm text-muted">
        Petakan peran (role) untuk masing-masing akun pengguna terdaftar.
      </p>
    </div>

    <UCard>
      <div v-if="pending" class="space-y-3">
        <USkeleton v-for="item in 4" :key="item" class="h-16 w-full" />
      </div>

      <div v-else-if="!data.users.length" class="flex min-h-48 flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-users" class="mb-3 size-10 text-muted" />
        <p class="text-sm text-muted">Belum ada user terdaftar.</p>
      </div>

      <div v-else class="divide-y divide-default">
        <div
          v-for="userItem in data.users"
          :key="userItem.id"
          class="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h3 class="font-semibold text-highlighted">{{ userItem.name }}</h3>
            <p class="text-sm text-muted">{{ userItem.email }}</p>
            <div class="mt-1">
              <span class="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Role Aktif: {{ userItem.roleName || 'Belum diatur (Default: USER)' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <USelect
              :model-value="userItem.roleId || ''"
              :items="data.roles.map(r => ({ label: r.name, value: r.id }))"
              placeholder="Pilih Role"
              class="w-48"
              :loading="updatingId === userItem.id"
              @update:model-value="(val) => changeRole(userItem.id, val)"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
