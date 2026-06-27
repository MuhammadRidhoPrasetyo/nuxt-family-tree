<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

type Permission = {
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

const { data, pending, refresh } = await useFetch<{ permissions: Permission[] }>('/api/admin/permissions', {
  credentials: 'include',
  default: () => ({ permissions: [] })
})

const createPermission = async () => {
  if (!form.name.trim()) return
  loading.value = true

  try {
    await $fetch('/api/admin/permissions', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })
    toast.add({ title: 'Permission berhasil ditambahkan' })
    form.name = ''
    form.description = ''
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan permission.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const deletePermission = async (id: string, name: string) => {
  if (!confirm(`Hapus permission "${name}"?`)) return
  deletingId.value = id

  try {
    await $fetch(`/api/admin/permissions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Permission berhasil dihapus' })
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus permission.'
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
        Kelola Permissions
      </h1>
      <p class="text-sm text-muted">
        Definisikan izin akses spesifik (misal: create:family, delete:member).
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
      <!-- Form Input -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Tambah Permission Baru
          </h2>
        </template>
        <form class="space-y-4" @submit.prevent="createPermission">
          <UFormField label="Nama Permission" name="name" required>
            <UInput v-model="form.name" placeholder="Contoh: create:family, view:logs" required class="w-full" />
          </UFormField>

          <UFormField label="Deskripsi" name="description">
            <UTextarea v-model="form.description" placeholder="Keterangan permission..." :rows="3" class="w-full" />
          </UFormField>

          <UButton type="submit" block :loading="loading" icon="i-lucide-plus">
            Tambah Permission
          </UButton>
        </form>
      </UCard>

      <!-- List Data -->
      <UCard>
        <div v-if="pending" class="space-y-3">
          <USkeleton v-for="item in 3" :key="item" class="h-16 w-full" />
        </div>

        <div v-else-if="!data.permissions.length" class="flex min-h-48 flex-col items-center justify-center text-center">
          <UIcon name="i-lucide-key" class="mb-3 size-10 text-muted" />
          <p class="text-sm text-muted">Belum ada permission terdaftar.</p>
        </div>

        <div v-else class="divide-y divide-default">
          <div
            v-for="permission in data.permissions"
            :key="permission.id"
            class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div>
              <h3 class="font-semibold text-highlighted">{{ permission.name }}</h3>
              <p class="text-sm text-muted">{{ permission.description || '-' }}</p>
            </div>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :loading="deletingId === permission.id"
              @click="deletePermission(permission.id, permission.name)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
