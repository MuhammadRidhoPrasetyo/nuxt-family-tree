<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// Mock invitations data since invitations backend API is not yet built
const invitations = ref([
  { id: '1', email: 'keluarga.besar@example.com', role: 'VIEWER', expiredAt: '2026-07-04', status: 'PENDING' },
  { id: '2', email: 'sepupu@example.com', role: 'EDITOR', expiredAt: '2026-06-30', status: 'ACCEPTED' }
])

const roleLabel: Record<string, string> = {
  EDITOR: 'Editor',
  VIEWER: 'Viewer'
}

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'primary' | 'neutral'> = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  EXPIRED: 'error'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Undangan Kolaborasi
        </h1>
        <p class="text-sm text-muted">
          Undang anggota keluarga lain untuk melihat atau mengedit silsilah keluarga Anda secara bersama-sama.
        </p>
      </div>

      <UButton icon="i-lucide-plus" disabled>
        Buat Undangan
      </UButton>
    </div>

    <UCard>
      <div v-if="!invitations.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-send" class="mb-3 size-10 text-muted" />
        <h2 class="text-lg font-semibold text-highlighted">Belum ada undangan</h2>
        <p class="mt-1 max-w-md text-sm text-muted">Kirim undangan baru melalui email untuk mulai berkolaborasi.</p>
      </div>

      <div v-else class="divide-y divide-default">
        <div
          v-for="invitation in invitations"
          :key="invitation.id"
          class="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-semibold text-highlighted">{{ invitation.email }}</h2>
              <UBadge variant="subtle" :color="statusColor[invitation.status]">{{ invitation.status }}</UBadge>
            </div>
            <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              <span>Peran: {{ roleLabel[invitation.role] }}</span>
              <span>Kedaluwarsa: {{ invitation.expiredAt }}</span>
            </div>
          </div>

          <div class="flex shrink-0 gap-2">
            <UButton icon="i-lucide-trash" color="error" variant="outline" size="sm" disabled>
              Batalkan
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
