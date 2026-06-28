<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

type Invitation = {
  id: string
  email: string
  role: 'EDITOR' | 'VIEWER'
  expiredAt: string
  createdAt: string
  familyName: string
  inviterName: string | null
}

const toast = useToast()
const processingId = ref<string | null>(null)

const { data, pending, refresh } = await useFetch<{ invitations: Invitation[] }>('/api/invitations', {
  credentials: 'include',
  default: () => ({ invitations: [] })
})

const roleLabel = {
  EDITOR: 'Editor (Bisa mengedit)',
  VIEWER: 'Viewer (Hanya melihat)'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const acceptInvite = async (id: string, familyName: string) => {
  processingId.value = id
  try {
    await $fetch(`/api/invitations/${id}/accept`, {
      method: 'POST',
      credentials: 'include'
    })
    toast.add({ title: 'Undangan diterima', description: `Anda sekarang berkolaborasi di keluarga "${familyName}".` })
    await refresh()
  } catch (error: any) {
    const message = error.data?.message || 'Gagal menerima undangan.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    processingId.value = null
  }
}

const declineInvite = async (id: string) => {
  processingId.value = id
  try {
    await $fetch(`/api/invitations/${id}/decline`, {
      method: 'POST',
      credentials: 'include'
    })
    toast.add({ title: 'Undangan ditolak' })
    await refresh()
  } catch (error: any) {
    const message = error.data?.message || 'Gagal menolak undangan.'
    toast.add({ title: 'Gagal', description: message, color: 'error' })
  } finally {
    processingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Undangan Masuk
      </h1>
      <p class="text-sm text-muted">
        Daftar undangan kolaborasi dari pemilik silsilah keluarga lainnya untuk berkolaborasi bersama.
      </p>
    </div>

    <UCard>
      <div v-if="pending" class="space-y-3 py-4">
        <USkeleton v-for="item in 2" :key="item" class="h-16 w-full" />
      </div>

      <div v-else-if="!data.invitations.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-mail-open" class="mb-3 size-10 text-muted" />
        <h2 class="text-lg font-semibold text-highlighted">Tidak ada undangan baru</h2>
        <p class="mt-1 max-w-md text-sm text-muted">Saat ini Anda tidak memiliki undangan kolaborasi yang tertunda.</p>
      </div>

      <div v-else class="divide-y divide-default">
        <div
          v-for="invite in data.invitations"
          :key="invite.id"
          class="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-warning animate-pulse shrink-0" />
              <h2 class="font-semibold text-highlighted">
                Undangan bergabung dengan "{{ invite.familyName }}"
              </h2>
            </div>
            <p class="text-xs text-muted">
              Diundang oleh: <span class="font-medium text-highlighted">{{ invite.inviterName || 'Pemilik Keluarga' }}</span>
            </p>
            <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
              <span>Peran: {{ roleLabel[invite.role] }}</span>
              <span>Hingga: {{ formatDate(invite.expiredAt) }}</span>
            </div>
          </div>

          <div class="flex shrink-0 gap-2 items-center">
            <UButton
              color="error"
              variant="outline"
              size="sm"
              icon="i-lucide-x"
              :disabled="processingId !== null"
              :loading="processingId === invite.id"
              @click="declineInvite(invite.id)"
            >
              Tolak
            </UButton>
            <UButton
              color="primary"
              size="sm"
              icon="i-lucide-check"
              :disabled="processingId !== null"
              :loading="processingId === invite.id"
              @click="acceptInvite(invite.id, invite.familyName)"
            >
              Terima
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
