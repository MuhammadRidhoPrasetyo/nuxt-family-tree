<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

type Role = {
  id: string
  name: string
  description: string | null
  createdAt: string
}

const toast = useToast()
const loading = ref(false)
const deletingId = ref<string | null>(null)

const form = reactive({
  name: '',
  description: ''
})

const { data, pending, refresh } = await useFetch<{ roles: Role[] }>('/api/admin/roles', {
  credentials: 'include',
  default: () => ({ roles: [] })
})

const createRole = async () => {
  if (!form.name.trim()) return
  loading.value = true

  try {
    await $fetch('/api/admin/roles', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })
    toast.add({ title: 'Role berhasil ditambahkan' })
    form.name = ''
    form.description = ''
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan role.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const deleteRole = async (id: string, name: string) => {
  if (!confirm(`Hapus role "${name}"?`)) return
  deletingId.value = id

  try {
    await $fetch(`/api/admin/roles/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Role berhasil dihapus' })
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus role.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Kelola Roles
      </h1>
      <p class="text-sm text-muted">
        Definisikan peran pengguna untuk hak akses sistem global.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
      <!-- Form Input -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Tambah Role Baru
          </h2>
        </template>
        <form class="space-y-4" @submit.prevent="createRole">
          <UFormField label="Nama Role" name="name" required>
            <UInput v-model="form.name" placeholder="Contoh: EDITOR, VIEWER" required class="w-full" />
          </UFormField>

          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="form.description" placeholder="Keterangan role..." :rows="3" class="w-full" />
          </UFormField>

          <UButton type="submit" block :loading="loading" icon="i-lucide-plus">
            Tambah Role
          </UButton>
        </form>
      </UCard>

      <!-- List Data -->
      <UCard>
        <div v-if="pending" class="space-y-3">
          <USkeleton v-for="item in 3" :key="item" class="h-16 w-full" />
        </div>

        <div v-else-if="!data.roles.length" class="flex min-h-48 flex-col items-center justify-center text-center">
          <UIcon name="i-lucide-shield" class="mb-3 size-10 text-muted" />
          <p class="text-sm text-muted">Belum ada role terdaftar.</p>
        </div>

        <div v-else class="divide-y divide-default">
          <div
            v-for="role in data.roles"
            :key="role.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div>
              <h3 class="font-semibold text-highlighted">{{ role.name }}</h3>
              <p class="text-sm text-muted">{{ role.description || '-' }}</p>
            </div>
            <UButton
              v-if="role.name !== 'USER' && role.name !== 'ADMIN'"
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :loading="deletingId === role.id"
              @click="deleteRole(role.id, role.name)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
