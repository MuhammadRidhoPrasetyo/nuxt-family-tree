<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const toast = useToast()
const loading = ref(false)
const isManualSlug = ref(false)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  visibility: 'PRIVATE'
})

const visibilityItems = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Invite only', value: 'INVITE_ONLY' },
  { label: 'Public', value: 'PUBLIC' }
]

watch(() => form.name, (name) => {
  if (!isManualSlug.value) {
    form.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
})

const createFamily = async () => {
  loading.value = true

  try {
    await $fetch('/api/families', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })
    toast.add({ title: 'Family tree disimpan' })
    await navigateTo('/families')
  } catch (error: any) {
    const data = error?.data
    const message = data?.message || error?.message || 'Family tree gagal disimpan.'
    toast.add({ title: 'Gagal menyimpan', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Tambah Family Tree
      </h1>
      <p class="text-sm text-muted">
        Buat workspace baru untuk anggota, relasi, privasi, media, dan undangan keluarga.
      </p>
    </div>

    <UCard>
      <form class="space-y-5" @submit.prevent="createFamily">
        <UFormField label="Nama family tree" name="name" required>
          <UInput v-model="form.name" icon="i-lucide-git-fork" required class="w-full" />
        </UFormField>

        <UFormField label="Slug" name="slug" required>
          <UInput v-model="form.slug" icon="i-lucide-link" required class="w-full" @input="isManualSlug = true" />
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
