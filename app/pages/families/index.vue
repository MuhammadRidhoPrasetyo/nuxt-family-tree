<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

type Family = {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: 'PRIVATE' | 'INVITE_ONLY' | 'PUBLIC'
  createdAt: string
  updatedAt: string
}

const toast = useToast()
const deletingId = ref<string | null>(null)

const { data, pending, refresh } = await useFetch<{ families: Family[] }>('/api/families', {
  credentials: 'include',
  default: () => ({ families: [] })
})

const visibilityLabel = {
  PRIVATE: 'Private',
  INVITE_ONLY: 'Invite only',
  PUBLIC: 'Public'
}

const deleteFamily = async (family: Family) => {
  if (!confirm(`Hapus family tree "${family.name}"?`)) {
    return
  }

  deletingId.value = family.id

  try {
    await $fetch(`/api/families/${family.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Family tree dihapus' })
    await refresh()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Family tree gagal dihapus.'
    toast.add({ title: 'Gagal menghapus', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Families
        </h1>
        <p class="text-sm text-muted">
          Kelola workspace family tree yang Anda miliki.
        </p>
      </div>

      <UButton to="/families/create" icon="i-lucide-plus">
        Tambah Family Tree
      </UButton>
    </div>

    <UCard>
      <div v-if="pending" class="space-y-3">
        <USkeleton v-for="item in 3" :key="item" class="h-20 w-full" />
      </div>

      <div v-else-if="!data.families.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-git-fork" class="mb-3 size-10 text-muted" />
        <h2 class="text-lg font-semibold text-highlighted">
          Belum ada family tree
        </h2>
        <p class="mt-1 max-w-md text-sm text-muted">
          Buat family tree pertama untuk mulai menambahkan anggota dan relasi keluarga.
        </p>
        <UButton to="/families/create" icon="i-lucide-plus" class="mt-5">
          Tambah Family Tree
        </UButton>
      </div>

      <div v-else class="divide-y divide-default">
        <div
          v-for="family in data.families"
          :key="family.id"
          class="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0 flex-1">
            <NuxtLink :to="`/families/${family.id}`" class="group">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-semibold text-highlighted group-hover:text-primary transition-colors">
                  {{ family.name }}
                </h2>
                <UBadge variant="subtle">
                  {{ visibilityLabel[family.visibility] }}
                </UBadge>
              </div>
              <p class="mt-1 text-sm text-muted group-hover:text-primary/70 transition-colors">
                /{{ family.slug }}
              </p>
              <p v-if="family.description" class="mt-2 line-clamp-2 text-sm text-muted">
                {{ family.description }}
              </p>
            </NuxtLink>
          </div>

          <div class="flex shrink-0 gap-2 items-center">
            <UButton :to="`/families/${family.id}`" icon="i-lucide-eye" color="primary" variant="subtle">
              Lihat Tree
            </UButton>
            <UButton :to="`/families/${family.id}/settings`" icon="i-lucide-settings" color="neutral" variant="outline">
              Pengaturan
            </UButton>
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="outline"
              :loading="deletingId === family.id"
              @click="deleteFamily(family)"
            >
              Hapus
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
