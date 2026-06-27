<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// Mock members data since backend members API is not yet built
const members = ref([
  { id: '1', fullName: 'Budi Santoso', nickname: 'Budi', gender: 'MALE', birthPlace: 'Jakarta', birthDate: '1980-05-12', isAlive: true, occupation: 'Software Engineer', relation: 'Kepala Keluarga' },
  { id: '2', fullName: 'Siti Aminah', nickname: 'Siti', gender: 'FEMALE', birthPlace: 'Bandung', birthDate: '1983-09-20', isAlive: true, occupation: 'Teacher', relation: 'Istri' },
  { id: '3', fullName: 'Roni Santoso', nickname: 'Roni', gender: 'MALE', birthPlace: 'Jakarta', birthDate: '2010-11-05', isAlive: true, occupation: 'Pelajar', relation: 'Anak Kandung' }
])

const genderLabel: Record<string, string> = {
  MALE: 'Laki-laki',
  FEMALE: 'Perempuan',
  UNKNOWN: 'Tidak diketahui'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Anggota Keluarga
        </h1>
        <p class="text-sm text-muted">
          Daftar seluruh anggota keluarga yang terdaftar dalam workspace Anda.
        </p>
      </div>

      <UButton icon="i-lucide-plus" disabled>
        Tambah Anggota
      </UButton>
    </div>

    <UCard>
      <div v-if="!members.length" class="flex min-h-64 flex-col items-center justify-center text-center">
        <UIcon name="i-lucide-users" class="mb-3 size-10 text-muted" />
        <h2 class="text-lg font-semibold text-highlighted">Belum ada anggota</h2>
        <p class="mt-1 max-w-md text-sm text-muted">Mulai tambahkan anggota keluarga melalui visualisasi tree atau menu edit keluarga.</p>
      </div>

      <div v-else class="divide-y divide-default">
        <div
          v-for="member in members"
          :key="member.id"
          class="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-semibold text-highlighted">{{ member.fullName }} ({{ member.nickname }})</h2>
              <UBadge variant="subtle" color="primary">{{ member.relation }}</UBadge>
            </div>
            <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              <span>Gander: {{ genderLabel[member.gender] }}</span>
              <span>Tempat/Tgl Lahir: {{ member.birthPlace }}, {{ member.birthDate }}</span>
              <span>Pekerjaan: {{ member.occupation }}</span>
            </div>
          </div>

          <div class="flex shrink-0 gap-2">
            <UButton icon="i-lucide-pencil" color="neutral" variant="outline" size="sm" disabled>
              Edit
            </UButton>
            <UButton icon="i-lucide-trash-2" color="error" variant="outline" size="sm" disabled>
              Hapus
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
