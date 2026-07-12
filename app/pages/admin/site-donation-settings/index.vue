<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

type SiteDonationSetting = {
  id: string
  type: 'BANK_TRANSFER' | 'QRIS'
  providerName: string | null
  accountName: string | null
  accountNumber: string | null
  qrImageUrl: string | null
  instructions: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

const currentUser = useCurrentUser()
const toast = useToast()

if (currentUser.value?.role !== 'ADMIN') {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden'
  })
}

const defaultForm = () => ({
  type: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'QRIS',
  providerName: '',
  accountName: '',
  accountNumber: '',
  qrImageUrl: '',
  instructions: '',
  isActive: true
})

const form = reactive(defaultForm())
const editingId = ref<string | null>(null)
const saving = ref(false)
const deletingId = ref<string | null>(null)

const typeItems = [
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
  { label: 'QRIS', value: 'QRIS' }
]

const getErrorMessage = (error: any, fallback: string) => {
  return error?.data?.message || error?.statusMessage || error?.message || fallback
}

const updateType = (value: unknown) => {
  const normalized = typeof value === 'string'
    ? value
    : ((value as { value?: string } | null)?.value ?? 'BANK_TRANSFER')

  form.type = normalized === 'QRIS' ? 'QRIS' : 'BANK_TRANSFER'
}

const { data, pending, refresh } = await useFetch<{ settings: SiteDonationSetting[] }>('/api/admin/site-donation-settings', {
  credentials: 'include',
  default: () => ({ settings: [] })
})

const resetForm = () => {
  editingId.value = null
  Object.assign(form, defaultForm())
}

const submitForm = async () => {
  saving.value = true

  try {
    if (editingId.value) {
      await $fetch(`/api/admin/site-donation-settings/${editingId.value}`, {
        method: 'PATCH',
        body: form,
        credentials: 'include'
      })
      toast.add({ title: 'Site donation setting berhasil diperbarui' })
    } else {
      await $fetch('/api/admin/site-donation-settings', {
        method: 'POST',
        body: form,
        credentials: 'include'
      })
      toast.add({ title: 'Site donation setting berhasil ditambahkan' })
    }

    resetForm()
    await refresh()
  } catch (error) {
    toast.add({ title: 'Gagal', description: getErrorMessage(error, 'Gagal menyimpan site donation setting.'), color: 'error' })
  } finally {
    saving.value = false
  }
}

const startEdit = (setting: SiteDonationSetting) => {
  editingId.value = setting.id
  form.type = setting.type
  form.providerName = setting.providerName || ''
  form.accountName = setting.accountName || ''
  form.accountNumber = setting.accountNumber || ''
  form.qrImageUrl = setting.qrImageUrl || ''
  form.instructions = setting.instructions || ''
  form.isActive = setting.isActive
}

const removeSetting = async (setting: SiteDonationSetting) => {
  if (!confirm(`Hapus metode "${setting.providerName || setting.type}"?`)) return
  deletingId.value = setting.id

  try {
    await $fetch(`/api/admin/site-donation-settings/${setting.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Site donation setting berhasil dihapus' })
    if (editingId.value === setting.id) {
      resetForm()
    }
    await refresh()
  } catch (error) {
    toast.add({ title: 'Gagal', description: getErrorMessage(error, 'Gagal menghapus site donation setting.'), color: 'error' })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Site Donation Settings
      </h1>
      <p class="text-sm text-muted">
        Kelola rekening dan QRIS global untuk donasi situs.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[380px_1fr]">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-highlighted">
              {{ editingId ? 'Edit Metode Donasi' : 'Tambah Metode Donasi' }}
            </h2>
            <UButton v-if="editingId" color="neutral" variant="ghost" size="xs" @click="resetForm">
              Batal Edit
            </UButton>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submitForm">
          <UFormField label="Tipe" required>
            <USelect
              :model-value="form.type"
              :items="typeItems"
              class="w-full"
              @update:model-value="updateType"
            />
          </UFormField>

          <UFormField label="Nama Provider">
            <UInput v-model="form.providerName" placeholder="Contoh: BCA, Mandiri, QRIS" class="w-full" />
          </UFormField>

          <UFormField v-if="form.type === 'BANK_TRANSFER'" label="Nama Pemilik Rekening">
            <UInput v-model="form.accountName" placeholder="Nama pemilik rekening" class="w-full" />
          </UFormField>

          <UFormField v-if="form.type === 'BANK_TRANSFER'" label="Nomor Rekening">
            <UInput v-model="form.accountNumber" placeholder="Nomor rekening" class="w-full" />
          </UFormField>

          <UFormField v-if="form.type === 'QRIS'" label="URL Gambar QRIS">
            <UInput v-model="form.qrImageUrl" placeholder="https://..." class="w-full" />
          </UFormField>

          <UFormField label="Instruksi">
            <UTextarea v-model="form.instructions" placeholder="Instruksi transfer / upload bukti" :rows="4" class="w-full" />
          </UFormField>

          <UCheckbox v-model="form.isActive" label="Aktifkan metode ini" />

          <UButton type="submit" block :loading="saving" icon="i-lucide-save">
            {{ editingId ? 'Simpan Perubahan' : 'Tambah Metode' }}
          </UButton>
        </form>
      </UCard>

      <UCard>
        <div v-if="pending" class="space-y-3">
          <USkeleton v-for="item in 3" :key="item" class="h-24 w-full" />
        </div>

        <div v-else-if="!data.settings.length" class="flex min-h-48 flex-col items-center justify-center text-center">
          <UIcon name="i-lucide-wallet" class="mb-3 size-10 text-muted" />
          <p class="text-sm text-muted">Belum ada metode donasi yang dikonfigurasi.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="setting in data.settings"
            :key="setting.id"
            class="rounded-xl border border-default p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-semibold text-highlighted">
                    {{ setting.providerName || setting.type }}
                  </h3>
                  <UBadge :color="setting.isActive ? 'success' : 'neutral'" variant="subtle">
                    {{ setting.isActive ? 'Aktif' : 'Nonaktif' }}
                  </UBadge>
                  <UBadge color="primary" variant="soft">
                    {{ setting.type }}
                  </UBadge>
                </div>
                <p v-if="setting.accountName" class="mt-2 text-sm text-muted">
                  Atas Nama: {{ setting.accountName }}
                </p>
                <p v-if="setting.accountNumber" class="text-sm text-muted">
                  Nomor Rekening: {{ setting.accountNumber }}
                </p>
                <p v-if="setting.qrImageUrl" class="text-sm text-muted break-all">
                  QRIS: {{ setting.qrImageUrl }}
                </p>
                <p v-if="setting.instructions" class="mt-2 text-sm text-muted whitespace-pre-line">
                  {{ setting.instructions }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <UButton color="primary" variant="ghost" icon="i-lucide-pencil" @click="startEdit(setting)" />
                <UButton color="error" variant="ghost" icon="i-lucide-trash-2" :loading="deletingId === setting.id" @click="removeSetting(setting)" />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
