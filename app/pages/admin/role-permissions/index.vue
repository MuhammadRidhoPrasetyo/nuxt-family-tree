<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

type Role = {
  id: string
  name: string
  description: string | null
}

type Permission = {
  id: string
  name: string
  description: string | null
}

type Mapping = {
  id: string
  roleId: string
  permissionId: string
}

const toast = useToast()
const selectedRoleId = ref<string | null>(null)
const updatingId = ref<string | null>(null)

const { data, pending, refresh } = await useFetch<{
  roles: Role[]
  permissions: Permission[]
  mappings: Mapping[]
}>('/api/admin/role-permissions', {
  credentials: 'include',
  default: () => ({ roles: [], permissions: [], mappings: [] })
})

// Automatically select the first role
watchEffect(() => {
  const val = data.value
  const firstRole = val?.roles?.[0]
  if (firstRole && !selectedRoleId.value) {
    selectedRoleId.value = firstRole.id
  }
})

const hasPermission = (permissionId: string) => {
  if (!selectedRoleId.value) return false
  return data.value?.mappings.some(
    m => m.roleId === selectedRoleId.value && m.permissionId === permissionId
  ) || false
}

const togglePermission = async (permissionId: string, event: boolean) => {
  if (!selectedRoleId.value) return
  updatingId.value = permissionId

  try {
    await $fetch('/api/admin/role-permissions', {
      method: 'POST',
      body: {
        roleId: selectedRoleId.value,
        permissionId,
        action: event ? 'assign' : 'revoke'
      },
      credentials: 'include'
    })
    toast.add({ title: 'Hak akses berhasil diperbarui' })
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui hak akses.'
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
        Kelola Hak Akses (Role Permissions)
      </h1>
      <p class="text-sm text-muted">
        Petakan daftar izin (permissions) yang dimiliki oleh masing-masing peran (role).
      </p>
    </div>

    <div v-if="pending" class="space-y-3">
      <USkeleton class="h-40 w-full" />
    </div>

    <div v-else class="grid gap-6 md:grid-cols-[250px_1fr]">
      <!-- Roles Sidebar -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Roles</h2>
        </template>
        <div class="flex flex-col gap-1">
          <UButton
            v-for="role in data.roles"
            :key="role.id"
            :variant="selectedRoleId === role.id ? 'soft' : 'ghost'"
            :color="selectedRoleId === role.id ? 'primary' : 'neutral'"
            block
            class="justify-start text-left"
            @click="selectedRoleId = role.id"
          >
            {{ role.name }}
          </UButton>
        </div>
      </UCard>

      <!-- Permissions Checklist -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Permissions untuk Role: {{ data.roles.find(r => r.id === selectedRoleId)?.name || 'Pilih Role' }}
          </h2>
        </template>

        <div v-if="!data.permissions.length" class="flex min-h-32 flex-col items-center justify-center text-center">
          <UIcon name="i-lucide-key" class="mb-3 size-8 text-muted" />
          <p class="text-sm text-muted">Belum ada permission terdaftar. Buat permission terlebih dahulu.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="permission in data.permissions"
            :key="permission.id"
            class="flex items-start gap-3 rounded-lg border border-default p-3 hover:bg-muted/50 transition-colors"
          >
            <UCheckbox
              :model-value="hasPermission(permission.id)"
              :disabled="updatingId === permission.id"
              @update:model-value="(val) => togglePermission(permission.id, !!val)"
            />
            <div class="-mt-1 flex-1">
              <label class="text-sm font-semibold text-highlighted block">
                {{ permission.name }}
              </label>
              <span class="text-xs text-muted">
                {{ permission.description || 'Tidak ada deskripsi.' }}
              </span>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
