<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

type DonationMethod = {
  id: string
  type: 'BANK_TRANSFER' | 'QRIS'
  providerName: string | null
  accountName: string | null
  accountNumber: string | null
  qrImageUrl: string | null
  instructions: string | null
}

type PaidDonation = {
  id: string
  donorName: string
  isAnonymous: boolean
  amount: string
  currency: string
  paidAt: string | null
  createdAt: string
}

const currentUser = useCurrentUser()
const toast = useToast()
const submitting = ref(false)
const uploading = ref(false)

const form = reactive({
  paymentMethodId: '',
  donorName: currentUser.value?.name || '',
  donorEmail: currentUser.value?.email || '',
  isAnonymous: false,
  amount: 50000,
  transferSenderName: currentUser.value?.name || '',
  transferNote: '',
  proofFileUrl: ''
})

const { data, pending, refresh } = await useFetch<{ methods: DonationMethod[], donations: PaidDonation[] }>('/api/donations', {
  credentials: 'include',
  default: () => ({ methods: [], donations: [] })
})

watchEffect(() => {
  const firstMethod = data.value.methods[0]
  if (firstMethod && !form.paymentMethodId) {
    form.paymentMethodId = firstMethod.id
  }
})

const selectedMethod = computed(() => {
  return data.value.methods.find(method => method.id === form.paymentMethodId) || null
})

const methodItems = computed(() => {
  return data.value.methods.map(method => ({
    label: `${method.providerName || method.type} (${method.type === 'QRIS' ? 'QRIS' : 'Transfer Bank'})`,
    value: method.id
  }))
})

const totalDonations = computed(() => {
  return data.value.donations.reduce((sum, donation) => sum + Number(donation.amount), 0)
})

const formatCurrency = (value: string | number, currency = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(Number(value))
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getErrorMessage = (error: any, fallback: string) => {
  return error?.data?.message || error?.statusMessage || error?.message || fallback
}

const uploadProof = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  uploading.value = true

  try {
    const result = await $fetch<{ url: string }>('/api/donations/upload-proof', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    form.proofFileUrl = result.url
    toast.add({ title: 'Bukti transfer berhasil diunggah' })
  } catch (error) {
    toast.add({ title: 'Gagal upload', description: getErrorMessage(error, 'Gagal mengunggah bukti transfer.'), color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const submitDonation = async () => {
  if (!form.paymentMethodId) {
    toast.add({ title: 'Pilih metode donasi terlebih dahulu', color: 'warning' })
    return
  }

  if (!form.proofFileUrl) {
    toast.add({ title: 'Upload bukti transfer terlebih dahulu', color: 'warning' })
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/donations', {
      method: 'POST',
      body: form,
      credentials: 'include'
    })
    toast.add({ title: 'Donasi berhasil dikirim', description: 'Bukti transfer Anda menunggu verifikasi admin.' })
    form.amount = 50000
    form.transferNote = ''
    form.proofFileUrl = ''
    await refresh()
  } catch (error) {
    toast.add({ title: 'Gagal mengirim donasi', description: getErrorMessage(error, 'Gagal mengirim konfirmasi donasi.'), color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Donasi
        </h1>
        <p class="text-sm text-muted">
          Dukung operasional website ini agar tetap gratis digunakan semua orang.
        </p>
      </div>
      <UCard class="lg:min-w-64">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-heart-handshake" class="size-8 text-primary" />
          <div>
            <p class="text-xs text-muted">Total Donasi Terverifikasi</p>
            <p class="text-xl font-semibold text-highlighted">{{ formatCurrency(totalDonations) }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <div v-if="pending" class="grid gap-6 lg:grid-cols-[1fr_420px]">
      <USkeleton class="h-80 w-full" />
      <USkeleton class="h-80 w-full" />
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div class="space-y-6">
        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">Metode Donasi Aktif</h2>
          </template>

          <div v-if="!data.methods.length" class="flex min-h-40 flex-col items-center justify-center text-center">
            <UIcon name="i-lucide-wallet" class="mb-3 size-10 text-muted" />
            <p class="text-sm text-muted">Belum ada metode donasi aktif.</p>
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2">
            <button
              v-for="method in data.methods"
              :key="method.id"
              type="button"
              class="rounded-xl border p-4 text-left transition hover:bg-elevated/50"
              :class="form.paymentMethodId === method.id ? 'border-primary ring-1 ring-primary' : 'border-default'"
              @click="form.paymentMethodId = method.id"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold text-highlighted">{{ method.providerName || method.type }}</p>
                  <p class="text-xs text-muted">{{ method.type === 'QRIS' ? 'QRIS' : 'Transfer Bank' }}</p>
                </div>
                <UIcon :name="method.type === 'QRIS' ? 'i-lucide-qr-code' : 'i-lucide-landmark'" class="size-6 text-primary" />
              </div>

              <div class="mt-4 space-y-1 text-sm text-muted">
                <p v-if="method.accountName">Atas nama: {{ method.accountName }}</p>
                <p v-if="method.accountNumber" class="font-semibold text-highlighted">{{ method.accountNumber }}</p>
                <p v-if="method.instructions" class="line-clamp-2">{{ method.instructions }}</p>
              </div>
            </button>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">Donatur Terverifikasi</h2>
          </template>

          <div v-if="!data.donations.length" class="flex min-h-40 flex-col items-center justify-center text-center">
            <UIcon name="i-lucide-users" class="mb-3 size-10 text-muted" />
            <p class="text-sm text-muted">Belum ada donasi terverifikasi.</p>
          </div>

          <div v-else class="divide-y divide-default">
            <div
              v-for="donation in data.donations"
              :key="donation.id"
              class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div class="min-w-0">
                <p class="font-medium text-highlighted truncate">
                  {{ donation.isAnonymous ? 'Anonim' : donation.donorName }}
                </p>
                <p class="text-xs text-muted">{{ formatDate(donation.paidAt || donation.createdAt) }}</p>
              </div>
              <p class="font-semibold text-primary shrink-0">
                {{ formatCurrency(donation.amount, donation.currency) }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">Konfirmasi Donasi</h2>
        </template>

        <form class="space-y-4" @submit.prevent="submitDonation">
          <UFormField label="Metode Donasi" required>
            <USelect v-model="form.paymentMethodId" :items="methodItems" class="w-full" :disabled="!data.methods.length" />
          </UFormField>

          <div v-if="selectedMethod" class="rounded-xl border border-default bg-elevated/30 p-4 text-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-highlighted">{{ selectedMethod.providerName || selectedMethod.type }}</p>
                <p v-if="selectedMethod.accountName" class="text-muted">Atas nama: {{ selectedMethod.accountName }}</p>
                <p v-if="selectedMethod.accountNumber" class="text-highlighted font-semibold">{{ selectedMethod.accountNumber }}</p>
              </div>
              <img
                v-if="selectedMethod.qrImageUrl"
                :src="selectedMethod.qrImageUrl"
                alt="QRIS"
                class="size-24 rounded-lg border border-default object-cover"
              >
            </div>
            <p v-if="selectedMethod.instructions" class="mt-3 whitespace-pre-line text-muted">
              {{ selectedMethod.instructions }}
            </p>
          </div>

          <UFormField label="Nama Donatur" required>
            <UInput v-model="form.donorName" placeholder="Nama yang akan dicatat" class="w-full" />
          </UFormField>

          <UFormField label="Email">
            <UInput v-model="form.donorEmail" type="email" placeholder="email@example.com" class="w-full" />
          </UFormField>

          <UCheckbox v-model="form.isAnonymous" label="Tampilkan sebagai anonim" />

          <UFormField label="Nominal Donasi" required>
            <UInput v-model.number="form.amount" type="number" min="1" class="w-full" />
          </UFormField>

          <UFormField label="Nama Pengirim Transfer">
            <UInput v-model="form.transferSenderName" placeholder="Nama pada rekening/e-wallet" class="w-full" />
          </UFormField>

          <UFormField label="Catatan">
            <UTextarea v-model="form.transferNote" placeholder="Catatan opsional" :rows="3" class="w-full" />
          </UFormField>

          <UFormField label="Bukti Transfer" required>
            <div class="space-y-2">
              <UInput type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="w-full" :disabled="uploading" @change="uploadProof" />
              <p v-if="form.proofFileUrl" class="text-xs text-success">Bukti transfer sudah diunggah.</p>
            </div>
          </UFormField>

          <UButton type="submit" block :loading="submitting" :disabled="!data.methods.length || uploading" icon="i-lucide-send">
            Kirim Konfirmasi Donasi
          </UButton>
        </form>
      </UCard>
    </div>
  </div>
</template>
