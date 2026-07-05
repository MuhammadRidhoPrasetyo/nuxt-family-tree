<script setup lang="ts">
type NodeViewMode = 'CLASSIC_CARD' | 'COMPACT_MINIMAL' | 'DETAILED_PROFILE' | 'MEMORIAL_STYLE'

type Member = {
  id?: string
  fullName: string
  nickname?: string | null
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null
  birthDate?: string | Date | null
  birthPlace?: string | null
  deathDate?: string | Date | null
  deathPlace?: string | null
  isAlive?: boolean | null
  occupation?: string | null
  education?: string | null
  address?: string | null
  bio?: string | null
  photoUrl?: string | null
}

type NodeSettings = {
  showPhotos: boolean
  showBirthDates: boolean
  showNicknames: boolean
  colorByGender: boolean
}

const props = withDefaults(defineProps<{
  member: Member
  variant?: NodeViewMode
  settings?: Partial<NodeSettings>
  relationLabel?: string
  preview?: boolean
}>(), {
  variant: 'CLASSIC_CARD',
  relationLabel: '',
  preview: false
})

const effectiveSettings = computed<NodeSettings>(() => ({
  showPhotos: props.settings?.showPhotos ?? true,
  showBirthDates: props.settings?.showBirthDates ?? true,
  showNicknames: props.settings?.showNicknames ?? true,
  colorByGender: props.settings?.colorByGender ?? true
}))

const genderAccentClass = computed(() => {
  if (!effectiveSettings.value.colorByGender) return 'border-emerald-800'
  if (props.member.gender === 'MALE') return 'border-blue-500'
  if (props.member.gender === 'FEMALE') return 'border-pink-500'
  return 'border-zinc-400'
})

const genderPhotoClass = computed(() => {
  if (!effectiveSettings.value.colorByGender) return 'border-emerald-900/30'
  if (props.member.gender === 'MALE') return 'border-blue-100'
  if (props.member.gender === 'FEMALE') return 'border-pink-100'
  return 'border-zinc-200'
})

const fallbackIcon = computed(() => {
  if (props.member.gender === 'MALE') return 'i-lucide-user'
  if (props.member.gender === 'FEMALE') return 'i-lucide-user-2'
  return 'i-lucide-user-round'
})

const formatDate = (dateValue?: string | Date | null) => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatYear = (dateValue?: string | Date | null) => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  return String(date.getFullYear())
}

const lifespan = computed(() => {
  const birthYear = formatYear(props.member.birthDate)
  const deathYear = props.member.isAlive === false ? formatYear(props.member.deathDate) : 'Present'

  if (birthYear && deathYear) return `${birthYear} - ${deathYear}`
  if (birthYear) return `${birthYear} - ${props.member.isAlive === false ? '' : 'Present'}`
  if (props.member.isAlive === false && deathYear) return `Wafat ${deathYear}`
  return 'Tanggal belum tersedia'
})

const bornLine = computed(() => {
  const date = formatDate(props.member.birthDate)
  const place = props.member.birthPlace
  if (date && place) return `Lahir: ${date} • ${place}`
  if (date) return `Lahir: ${date}`
  if (place) return `Lahir di ${place}`
  return 'Data kelahiran belum tersedia'
})

const locationLine = computed(() => props.member.address || props.member.birthPlace || props.member.deathPlace || 'Lokasi belum tersedia')
const relationText = computed(() => props.relationLabel || 'Anggota Keluarga')
const memorialQuote = computed(() => props.member.bio || 'A life that touches others goes on forever.')
</script>

<template>
  <div class="family-tree-node select-none">
    <div
      v-if="variant === 'CLASSIC_CARD'"
      class="w-72 overflow-hidden rounded-lg border-t-[3px] bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
      :class="genderAccentClass"
    >
      <div class="flex items-center gap-4 p-4">
        <div
          v-if="effectiveSettings.showPhotos"
          class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-zinc-100 shadow-sm dark:bg-zinc-900"
          :class="genderPhotoClass"
        >
          <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.fullName" class="size-full object-cover">
          <UIcon v-else :name="fallbackIcon" class="size-7 text-zinc-500" />
        </div>

        <div class="min-w-0 flex-1 text-left">
          <div class="flex items-start justify-between gap-2">
            <h4 class="truncate text-base font-semibold leading-6 text-zinc-950 dark:text-zinc-50">
              {{ member.fullName }}
            </h4>
            <UIcon name="i-lucide-lock-keyhole" class="mt-0.5 size-4 shrink-0 text-zinc-500" />
          </div>
          <p v-if="effectiveSettings.showNicknames && member.nickname" class="truncate text-xs text-zinc-500">
            {{ member.nickname }}
          </p>
          <p v-if="effectiveSettings.showBirthDates" class="truncate text-xs text-zinc-500">
            {{ lifespan }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span class="truncate text-[11px] font-bold uppercase tracking-wide text-zinc-500">{{ relationText }}</span>
        <UIcon name="i-lucide-pencil" class="size-4 text-zinc-500" />
      </div>
    </div>

    <div
      v-else-if="variant === 'COMPACT_MINIMAL'"
      class="flex min-w-56 items-center gap-3 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-5 shadow-md transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div
        v-if="effectiveSettings.showPhotos"
        class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
      >
        <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.fullName" class="size-full object-cover">
        <UIcon v-else :name="fallbackIcon" class="size-5 text-zinc-500" />
      </div>
      <div class="min-w-0 text-left">
        <h4 class="truncate text-[13px] font-bold leading-tight text-zinc-950 dark:text-zinc-50">
          {{ member.fullName }}
        </h4>
        <p v-if="effectiveSettings.showBirthDates" class="truncate text-[10px] uppercase text-zinc-500">
          {{ lifespan }}
        </p>
      </div>
      <div class="ml-auto size-2 rounded-full bg-sky-600" />
    </div>

    <div
      v-else-if="variant === 'DETAILED_PROFILE'"
      class="w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div class="relative h-16 bg-emerald-900">
        <div
          v-if="effectiveSettings.showPhotos"
          class="absolute -bottom-6 left-6 flex size-16 items-center justify-center overflow-hidden rounded-lg border-4 border-white bg-zinc-100 shadow-md dark:border-zinc-950 dark:bg-zinc-900"
        >
          <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.fullName" class="size-full object-cover">
          <UIcon v-else :name="fallbackIcon" class="size-7 text-zinc-500" />
        </div>
        <span class="absolute right-4 top-3 rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          Archive ID: {{ member.id?.slice(0, 8) || 'Draft' }}
        </span>
      </div>

      <div class="px-6 pb-4 pt-8 text-left">
        <h4 class="truncate text-base font-semibold leading-6 text-zinc-950 dark:text-zinc-50">
          {{ member.fullName }}
        </h4>
        <p v-if="effectiveSettings.showNicknames && member.nickname" class="truncate text-xs text-zinc-500">
          {{ member.nickname }}
        </p>
        <p v-if="effectiveSettings.showBirthDates" class="mb-4 truncate text-xs text-zinc-500">
          {{ bornLine }}
        </p>

        <div class="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div class="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <UIcon name="i-lucide-briefcase" class="size-4 shrink-0" />
            <span class="truncate text-xs">{{ member.occupation || 'Pekerjaan belum diisi' }}</span>
          </div>
          <div class="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <UIcon name="i-lucide-graduation-cap" class="size-4 shrink-0" />
            <span class="truncate text-xs">{{ member.education || 'Pendidikan belum diisi' }}</span>
          </div>
          <div class="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
            <span class="truncate text-xs">{{ locationLine }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-2 bg-zinc-50 py-3 text-xs font-bold text-emerald-900 dark:bg-zinc-900 dark:text-emerald-300">
        <UIcon name="i-lucide-eye" class="size-4" />
        View Full Bio
      </div>
    </div>

    <div
      v-else
      class="relative flex w-72 flex-col items-center overflow-hidden rounded-sm border border-zinc-300 bg-zinc-50 p-6 text-center shadow-inner dark:border-zinc-700 dark:bg-zinc-950"
    >
      <div class="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#111827_1px,transparent_1px)] [background-size:12px_12px]" />
      <div class="relative mb-4">
        <div
          v-if="effectiveSettings.showPhotos"
          class="flex h-32 w-24 items-center justify-center overflow-hidden border border-zinc-300 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <img v-if="member.photoUrl" :src="member.photoUrl" :alt="member.fullName" class="size-full object-cover grayscale opacity-80">
          <UIcon v-else :name="fallbackIcon" class="size-9 text-zinc-500" />
        </div>
        <div class="absolute -bottom-2 -right-2 bg-zinc-50 p-1 dark:bg-zinc-950">
          <UIcon name="i-lucide-leaf" class="size-5 text-zinc-500" />
        </div>
      </div>
      <h4 class="mb-1 max-w-full truncate text-xl italic text-zinc-700 dark:text-zinc-200">
        {{ member.fullName }}
      </h4>
      <p v-if="effectiveSettings.showBirthDates" class="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        {{ lifespan }}
      </p>
      <div class="mb-4 h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
      <p class="line-clamp-2 px-4 text-xs italic leading-relaxed text-zinc-500">
        "{{ memorialQuote }}"
      </p>
    </div>
  </div>
</template>
