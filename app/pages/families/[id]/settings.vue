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
}

const route = useRoute()
const toast = useToast()
const loading = ref(false)
const deleting = ref(false)

const { data, error } = await useFetch<{ family: Family }>(`/api/families/${route.params.id}`, {
  credentials: 'include'
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Family not found'
  })
}

const form = reactive({
  name: data.value?.family.name ?? '',
  slug: data.value?.family.slug ?? '',
  description: data.value?.family.description ?? '',
  visibility: data.value?.family.visibility ?? 'PRIVATE'
})

const visibilityItems = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Invite only', value: 'INVITE_ONLY' },
  { label: 'Public', value: 'PUBLIC' }
]

const updateFamily = async () => {
  loading.value = true

  try {
    await $fetch(`/api/families/${route.params.id}`, {
      method: 'PATCH',
      body: form,
      credentials: 'include'
    })
    toast.add({ title: 'Family tree diperbarui' })
    await navigateTo('/families')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Family tree gagal diperbarui.'
    toast.add({ title: 'Gagal memperbarui', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const deleteFamily = async () => {
  if (!data.value?.family || !confirm(`Hapus family tree "${data.value.family.name}"?`)) {
    return
  }

  deleting.value = true

  try {
    await $fetch(`/api/families/${route.params.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Family tree dihapus' })
    await navigateTo('/families')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Family tree gagal dihapus.'
    toast.add({ title: 'Gagal menghapus', description: message, color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Edit Family Tree
        </h1>
        <p class="text-sm text-muted">
          Perbarui nama, slug, deskripsi, dan visibilitas family tree.
        </p>
      </div>

      <UButton color="error" variant="outline" icon="i-lucide-trash-2" :loading="deleting" @click="deleteFamily">
        Hapus
      </UButton>
    </div>

    <UCard>
      <form class="space-y-5" @submit.prevent="updateFamily">
        <UFormField label="Nama family tree" name="name" required>
          <UInput v-model="form.name" icon="i-lucide-git-fork" required class="w-full" />
        </UFormField>

        <UFormField label="Slug" name="slug" required>
          <UInput v-model="form.slug" icon="i-lucide-link" required class="w-full" />
        </UFormField>

        <UFormField label="Deskripsi" name="description">
          <UTextarea v-model="form.description" :rows="5" class="w-full" />
        </UFormField>

        <UFormField label="Visibility" name="visibility">
          <USelect v-model="form.visibility" :items="visibilityItems" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-3">
          <UButton to="/families" color="neutral" variant="outline">
            Batal
          </UButton>
          <UButton type="submit" icon="i-lucide-save" :loading="loading">
            Simpan
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
