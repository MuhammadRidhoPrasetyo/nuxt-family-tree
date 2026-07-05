<script setup lang="ts">
import NodeVariantPicker from '~/components/family-tree/NodeVariantPicker.vue'

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

type NodeViewMode = 'CLASSIC_CARD' | 'COMPACT_MINIMAL' | 'DETAILED_PROFILE' | 'MEMORIAL_STYLE'

type TreeNodeSettings = {
  showPhotos: boolean
  showBirthDates: boolean
  showNicknames: boolean
  colorByGender: boolean
}

type TreePreferences = TreeNodeSettings & {
  nodeViewMode: NodeViewMode
}

const defaultTreePreferences: TreePreferences = {
  nodeViewMode: 'CLASSIC_CARD',
  showPhotos: true,
  showBirthDates: true,
  showNicknames: true,
  colorByGender: true
}

const route = useRoute()
const toast = useToast()
const loading = ref(false)
const deleting = ref(false)
const savingTreePreferences = ref(false)
const isEditNameModalOpen = ref(false)
const savingFamilyName = ref(false)
const familyNameForm = reactive({
  name: ''
})

const { data, error } = await useFetch<{ family: Family }>(`/api/families/${route.params.id}`, {
  credentials: 'include'
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Family not found'
  })
}

// Fetch Privacy Settings
const { data: privacyData, refresh: refreshPrivacy } = await useFetch<{
  privacySettings: {
    showLivingPeople: boolean
    showBirthDate: boolean
    showDeathDate: boolean
    showContact: boolean
    allowExport: boolean
    allowGuestView: boolean
  }
  isOwner: boolean
}>(`/api/families/${route.params.id}/privacy-settings`, {
  credentials: 'include'
})

const isOwner = computed(() => privacyData.value?.isOwner ?? false)

const { data: treePreferenceData, refresh: refreshTreePreferences } = await useFetch<{ preferences: TreePreferences }>(`/api/families/${route.params.id}/tree-preferences`, {
  credentials: 'include',
  default: () => ({ preferences: defaultTreePreferences })
})

const treePreferences = reactive<TreePreferences>({ ...defaultTreePreferences })

const applyTreePreferences = (preferences?: Partial<TreePreferences>) => {
  treePreferences.nodeViewMode = preferences?.nodeViewMode || defaultTreePreferences.nodeViewMode
  treePreferences.showPhotos = preferences?.showPhotos ?? defaultTreePreferences.showPhotos
  treePreferences.showBirthDates = preferences?.showBirthDates ?? defaultTreePreferences.showBirthDates
  treePreferences.showNicknames = preferences?.showNicknames ?? defaultTreePreferences.showNicknames
  treePreferences.colorByGender = preferences?.colorByGender ?? defaultTreePreferences.colorByGender
}

watch(() => treePreferenceData.value?.preferences, (preferences) => {
  applyTreePreferences(preferences)
}, { immediate: true, deep: true })

const privacyForm = reactive({
  showLivingPeople: privacyData.value?.privacySettings.showLivingPeople ?? false,
  showBirthDate: privacyData.value?.privacySettings.showBirthDate ?? false,
  showDeathDate: privacyData.value?.privacySettings.showDeathDate ?? true,
  showContact: privacyData.value?.privacySettings.showContact ?? false,
  allowExport: privacyData.value?.privacySettings.allowExport ?? false,
  allowGuestView: privacyData.value?.privacySettings.allowGuestView ?? false
})

// Sync form if data changes
watch(() => privacyData.value, (newData) => {
  if (newData?.privacySettings) {
    privacyForm.showLivingPeople = newData.privacySettings.showLivingPeople
    privacyForm.showBirthDate = newData.privacySettings.showBirthDate
    privacyForm.showDeathDate = newData.privacySettings.showDeathDate
    privacyForm.showContact = newData.privacySettings.showContact
    privacyForm.allowExport = newData.privacySettings.allowExport
    privacyForm.allowGuestView = newData.privacySettings.allowGuestView
  }
}, { deep: true })

const updatePrivacySettings = async () => {
  if (!isOwner.value) {
    toast.add({ title: 'Akses Ditolak', description: 'Hanya pemilik (owner) yang dapat mengubah pengaturan ini.', color: 'error' })
    return
  }

  loading.value = true
  try {
    await $fetch(`/api/families/${route.params.id}/privacy-settings`, {
      method: 'PATCH',
      body: privacyForm,
      credentials: 'include'
    })
    toast.add({ title: 'Pengaturan privasi diperbarui', color: 'success' })
    await refreshPrivacy()
  } catch (err: any) {
    const message = err.data?.message || 'Gagal memperbarui pengaturan privasi.'
    toast.add({ title: 'Gagal memperbarui', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const saveTreePreferences = async () => {
  savingTreePreferences.value = true
  try {
    const res = await $fetch<{ preferences: TreePreferences }>(`/api/families/${route.params.id}/tree-preferences`, {
      method: 'PATCH',
      body: {
        nodeViewMode: treePreferences.nodeViewMode,
        showPhotos: treePreferences.showPhotos,
        showBirthDates: treePreferences.showBirthDates,
        showNicknames: treePreferences.showNicknames,
        colorByGender: treePreferences.colorByGender
      },
      credentials: 'include'
    })
    treePreferenceData.value = { preferences: res.preferences }
    toast.add({ title: 'Tampilan node default diperbarui', color: 'success' })
    await refreshTreePreferences()
  } catch (err: any) {
    const message = err.data?.message || 'Gagal menyimpan tampilan node.'
    toast.add({ title: 'Gagal menyimpan', description: message, color: 'error' })
  } finally {
    savingTreePreferences.value = false
  }
}

const openEditNameModal = () => {
  familyNameForm.name = data.value?.family.name || ''
  isEditNameModalOpen.value = true
}

const updateFamilyName = async () => {
  if (!isOwner.value || !data.value?.family) {
    toast.add({ title: 'Akses Ditolak', description: 'Hanya pemilik (owner) yang dapat mengubah nama family tree.', color: 'error' })
    return
  }

  const nextName = familyNameForm.name.trim()
  if (nextName.length < 2) {
    toast.add({ title: 'Nama terlalu pendek', description: 'Nama family tree minimal 2 karakter.', color: 'warning' })
    return
  }

  savingFamilyName.value = true
  try {
    const res = await $fetch<{ family: Family }>(`/api/families/${route.params.id}`, {
      method: 'PATCH',
      body: {
        name: nextName,
        slug: data.value.family.slug,
        description: data.value.family.description || '',
        visibility: data.value.family.visibility
      },
      credentials: 'include'
    })

    data.value.family = res.family
    isEditNameModalOpen.value = false
    toast.add({ title: 'Nama family tree diperbarui', color: 'success' })
  } catch (err: any) {
    const message = err.data?.message || 'Gagal mengubah nama family tree.'
    toast.add({ title: 'Gagal menyimpan', description: message, color: 'error' })
  } finally {
    savingFamilyName.value = false
  }
}

const deleteFamily = async () => {
  if (!isOwner.value) {
    toast.add({ title: 'Akses Ditolak', description: 'Hanya pemilik (owner) yang dapat menghapus family tree.', color: 'error' })
    return
  }

  if (!data.value?.family || !confirm(`Hapus family tree "${data.value.family.name}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`)) {
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
  } catch (err: any) {
    const message = err.data?.message || 'Family tree gagal dihapus.'
    toast.add({ title: 'Gagal menghapus', description: message, color: 'error' })
  } finally {
    deleting.value = false
  }
}

// COLLABORATORS STATE & METHODS
const { data: collaborators, refresh: refreshCollaborators } = await useFetch<{
  active: Array<{ id: string; userId: string; role: 'EDITOR' | 'VIEWER'; name: string | null; email: string; image: string | null }>
  pending: Array<{ id: string; email: string; role: 'EDITOR' | 'VIEWER'; expiredAt: string; createdAt: string }>
}>(`/api/families/${route.params.id}/collaborators`, {
  credentials: 'include',
  default: () => ({ active: [], pending: [] })
})

const inviteForm = reactive({
  email: '',
  role: 'VIEWER' as 'EDITOR' | 'VIEWER'
})
const inviting = ref(false)

const roleItems = [
  { label: 'Editor (Bisa mengedit)', value: 'EDITOR' },
  { label: 'Viewer (Hanya melihat)', value: 'VIEWER' }
]

const inviteCollaborator = async () => {
  if (!isOwner.value) return
  if (!inviteForm.email.trim()) return
  inviting.value = true
  try {
    await $fetch(`/api/families/${route.params.id}/collaborators`, {
      method: 'POST',
      body: inviteForm,
      credentials: 'include'
    })
    toast.add({ title: 'Undangan berhasil dikirim' })
    inviteForm.email = ''
    await refreshCollaborators()
  } catch (err: any) {
    const message = err.data?.message || 'Gagal mengirim undangan.'
    toast.add({ title: 'Gagal mengundang', description: message, color: 'error' })
  } finally {
    inviting.value = false
  }
}

const updatingId = ref<string | null>(null)
const updateRole = async (id: string, type: 'ACTIVE' | 'PENDING', role: 'EDITOR' | 'VIEWER') => {
  if (!isOwner.value) return
  updatingId.value = id
  try {
    await $fetch(`/api/families/${route.params.id}/collaborators`, {
      method: 'PATCH',
      body: { id, type, role },
      credentials: 'include'
    })
    toast.add({ title: 'Peran kolaborator diperbarui' })
    await refreshCollaborators()
  } catch (err: any) {
    const message = err.data?.message || 'Gagal memperbarui peran.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    updatingId.value = null
  }
}

const removingId = ref<string | null>(null)
const removeCollab = async (id: string, type: 'ACTIVE' | 'PENDING', label: string) => {
  if (!isOwner.value) return
  if (!confirm(`Hapus kolaborator/batalkan undangan untuk ${label}?`)) return
  removingId.value = id
  try {
    await $fetch(`/api/families/${route.params.id}/collaborators`, {
      method: 'DELETE',
      body: { id, type },
      credentials: 'include'
    })
    toast.add({ title: 'Kolaborator/undangan berhasil dihapus' })
    await refreshCollaborators()
  } catch (err: any) {
    const message = err.data?.message || 'Gagal menghapus.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    removingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink :to="`/families/${route.params.id}`" class="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            Kembali ke Visualisasi
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-semibold text-highlighted mt-1">
          Pengaturan Family Tree
        </h1>
        <p class="text-sm text-muted">
          {{ data?.family.name }} · Kelola privasi data silsilah keluarga dan undang kolaborator baru.
        </p>
      </div>

      <div v-if="isOwner" class="flex flex-wrap items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-pencil"
          @click="openEditNameModal"
        >
          Edit Nama
        </UButton>
        <UButton 
          color="error" 
          variant="outline" 
          icon="i-lucide-trash-2" 
          :loading="deleting" 
          @click="deleteFamily"
        >
          Hapus Family Tree
        </UButton>
      </div>
    </div>

    <!-- Alert for Non-Owner -->
    <div v-if="!isOwner" class="p-4 rounded-xl border border-warning/20 bg-warning/5 text-warning flex items-start gap-3 text-sm">
      <UIcon name="i-lucide-alert-triangle" class="size-5 shrink-0 mt-0.5" />
      <div>
        <h4 class="font-semibold text-highlighted">Mode Lihat Saja</h4>
        <p class="mt-0.5 text-xs text-muted">
          Anda tidak memiliki hak untuk mengubah pengaturan privasi atau mengelola kolaborator di silsilah keluarga ini. Hak ini hanya dimiliki oleh pemilik (owner).
        </p>
      </div>
    </div>

    <NodeVariantPicker
      v-model="treePreferences.nodeViewMode"
      :settings="treePreferences"
      :saving="savingTreePreferences"
      @update:settings="Object.assign(treePreferences, $event)"
      @save="saveTreePreferences"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Privacy Settings Form -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-highlighted">Pengaturan Privasi Silsilah</h2>
            <UBadge v-if="!isOwner" color="neutral" variant="subtle">Read-only</UBadge>
          </div>
        </template>
        <form class="space-y-6" @submit.prevent="updatePrivacySettings">
          <div class="divide-y divide-default">
            
            <div class="flex items-center justify-between py-4 first:pt-0">
              <div class="flex-1 pr-4">
                <label class="text-sm font-semibold text-highlighted">Tampilkan Orang yang Masih Hidup</label>
                <p class="text-xs text-muted mt-1">Mengizinkan data anggota keluarga yang berstatus masih hidup untuk ditampilkan.</p>
              </div>
              <USwitch v-model="privacyForm.showLivingPeople" :disabled="!isOwner" />
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex-1 pr-4">
                <label class="text-sm font-semibold text-highlighted">Tampilkan Tanggal Lahir</label>
                <p class="text-xs text-muted mt-1">Menampilkan informasi tanggal dan tempat lahir pada kartu detail anggota.</p>
              </div>
              <USwitch v-model="privacyForm.showBirthDate" :disabled="!isOwner" />
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex-1 pr-4">
                <label class="text-sm font-semibold text-highlighted">Tampilkan Tanggal Wafat</label>
                <p class="text-xs text-muted mt-1">Menampilkan informasi tanggal dan tempat wafat untuk anggota yang sudah meninggal.</p>
              </div>
              <USwitch v-model="privacyForm.showDeathDate" :disabled="!isOwner" />
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex-1 pr-4">
                <label class="text-sm font-semibold text-highlighted">Tampilkan Kontak</label>
                <p class="text-xs text-muted mt-1">Menampilkan info kontak seperti nomor telepon dan email anggota keluarga.</p>
              </div>
              <USwitch v-model="privacyForm.showContact" :disabled="!isOwner" />
            </div>

            <div class="flex items-center justify-between py-4">
              <div class="flex-1 pr-4">
                <label class="text-sm font-semibold text-highlighted">Izinkan Ekspor Data</label>
                <p class="text-xs text-muted mt-1">Mengizinkan pengguna dengan hak akses tertentu untuk mengekspor silsilah keluarga.</p>
              </div>
              <USwitch v-model="privacyForm.allowExport" :disabled="!isOwner" />
            </div>

            <div class="flex items-center justify-between py-4 last:pb-0">
              <div class="flex-1 pr-4">
                <label class="text-sm font-semibold text-highlighted">Izinkan Tamu Melihat</label>
                <p class="text-xs text-muted mt-1">Mengizinkan tamu umum (tanpa masuk akun/non-member) untuk melihat silsilah keluarga ini.</p>
              </div>
              <USwitch v-model="privacyForm.allowGuestView" :disabled="!isOwner" />
            </div>

          </div>

          <div v-if="isOwner" class="flex justify-end gap-3 pt-4 border-t border-default">
            <UButton :to="`/families/${route.params.id}`" color="neutral" variant="outline">
              Batal
            </UButton>
            <UButton type="submit" icon="i-lucide-save" :loading="loading">
              Simpan Pengaturan
            </UButton>
          </div>
        </form>
      </UCard>

      <!-- Collaborator Management -->
      <div class="space-y-6 lg:col-span-1">
        <!-- Invite Card -->
        <UCard v-if="isOwner">
          <template #header>
            <h2 class="font-semibold text-highlighted">Undang Kolaborator</h2>
          </template>
          <form class="space-y-4" @submit.prevent="inviteCollaborator">
            <UFormField label="Email Pengguna" name="email" required>
              <UInput v-model="inviteForm.email" type="email" placeholder="contoh@email.com" icon="i-lucide-mail" required class="w-full" />
            </UFormField>
            <UFormField label="Peran (Role)" name="role">
              <USelect v-model="inviteForm.role" :items="roleItems" class="w-full" />
            </UFormField>
            <UButton type="submit" icon="i-lucide-send" :loading="inviting" class="w-full justify-center">
              Kirim Undangan
            </UButton>
          </form>
        </UCard>

        <!-- Collaborators list Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-highlighted">Daftar Kolaborator</h2>
              <UBadge v-if="!isOwner" color="neutral" variant="subtle">Read-only</UBadge>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Active Collaborators -->
            <div>
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Aktif</h3>
              <div v-if="!collaborators.active.length" class="text-sm text-muted py-2">
                Belum ada kolaborator aktif.
              </div>
              <div v-else class="space-y-3">
                <div v-for="collab in collaborators.active" :key="collab.id" class="flex items-center justify-between gap-2 p-2 rounded-lg bg-default border border-default">
                  <div class="min-w-0 flex-1 flex items-center gap-2">
                    <UAvatar :src="collab.image ?? undefined" :alt="collab.name ?? collab.email" size="sm" />
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-highlighted truncate">{{ collab.name || 'User' }}</p>
                      <p class="text-[10px] text-muted truncate">{{ collab.email }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <select
                      :value="collab.role"
                      @change="updateRole(collab.id, 'ACTIVE', ($event.target as HTMLSelectElement).value as 'EDITOR' | 'VIEWER')"
                      class="text-xs bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 py-1 focus:ring-0 cursor-pointer text-highlighted"
                      :disabled="updatingId === collab.id || !isOwner"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <UButton
                      v-if="isOwner"
                      icon="i-lucide-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :loading="removingId === collab.id"
                      @click="removeCollab(collab.id, 'ACTIVE', collab.name || collab.email)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Pending Invitations -->
            <div>
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Undangan Pending</h3>
              <div v-if="!collaborators.pending.length" class="text-sm text-muted py-2">
                Tidak ada undangan pending.
              </div>
              <div v-else class="space-y-3">
                <div v-for="invite in collaborators.pending" :key="invite.id" class="flex items-center justify-between gap-2 p-2 rounded-lg bg-default border border-default border-dashed">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-highlighted truncate">{{ invite.email }}</p>
                    <p class="text-[10px] text-warning">Menunggu persetujuan</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <select
                      :value="invite.role"
                      @change="updateRole(invite.id, 'PENDING', ($event.target as HTMLSelectElement).value as 'EDITOR' | 'VIEWER')"
                      class="text-xs bg-transparent border-0 border-b border-neutral-300 dark:border-neutral-700 py-1 focus:ring-0 cursor-pointer text-highlighted"
                      :disabled="updatingId === invite.id || !isOwner"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <UButton
                      v-if="isOwner"
                      icon="i-lucide-x"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :loading="removingId === invite.id"
                      @click="removeCollab(invite.id, 'PENDING', invite.email)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <UModal
      v-model:open="isEditNameModalOpen"
      title="Edit Nama Family Tree"
      description="Ubah nama yang ditampilkan untuk family tree ini."
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="updateFamilyName">
          <UFormField label="Nama Family Tree" name="name" required>
            <UInput
              v-model="familyNameForm.name"
              icon="i-lucide-pencil"
              placeholder="Nama family tree"
              required
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              @click="isEditNameModalOpen = false"
            >
              Batal
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="savingFamilyName"
            >
              Simpan Nama
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
