<script setup lang="ts">
import FamilyTreeNode from './FamilyTreeNode.vue'

type NodeViewMode = 'CLASSIC_CARD' | 'COMPACT_MINIMAL' | 'DETAILED_PROFILE' | 'MEMORIAL_STYLE'

type NodeSettings = {
  showPhotos: boolean
  showBirthDates: boolean
  showNicknames: boolean
  colorByGender: boolean
}

const props = withDefaults(defineProps<{
  modelValue: NodeViewMode
  settings: NodeSettings
  saving?: boolean
}>(), {
  saving: false
})

const emit = defineEmits<{
  'update:modelValue': [value: NodeViewMode]
  'update:settings': [value: NodeSettings]
  save: []
}>()

const settingItems: Array<{ key: keyof NodeSettings, label: string }> = [
  { key: 'showPhotos', label: 'Foto' },
  { key: 'showBirthDates', label: 'Tanggal lahir' },
  { key: 'showNicknames', label: 'Nama panggilan' },
  { key: 'colorByGender', label: 'Warna gender' }
]

const toggleSetting = (key: keyof NodeSettings) => {
  emit('update:settings', {
    ...props.settings,
    [key]: !props.settings[key]
  })
}

const variants: Array<{
  value: NodeViewMode
  label: string
  badgeClass: string
  previewHeight: string
  member: any
  relationLabel?: string
}> = [
  {
    value: 'CLASSIC_CARD',
    label: '01. Classic Card',
    badgeClass: 'bg-emerald-900 text-emerald-100',
    previewHeight: 'h-64',
    relationLabel: 'Biological Father',
    member: {
      id: 'classic-preview',
      fullName: 'Agus Santoso',
      gender: 'MALE',
      birthDate: '1945-01-01',
      isAlive: true
    }
  },
  {
    value: 'COMPACT_MINIMAL',
    label: '02. Compact / Minimal',
    badgeClass: 'bg-amber-200 text-amber-900',
    previewHeight: 'h-64',
    member: {
      id: 'compact-preview',
      fullName: 'Siti Aminah',
      gender: 'FEMALE',
      birthDate: '1982-01-01',
      isAlive: true
    }
  },
  {
    value: 'DETAILED_PROFILE',
    label: '03. Detailed Profile',
    badgeClass: 'bg-sky-950 text-sky-100',
    previewHeight: 'h-80',
    member: {
      id: 'detailed-preview',
      fullName: 'Bambang Wijaya',
      gender: 'MALE',
      birthDate: '1974-08-12',
      birthPlace: 'Jakarta',
      isAlive: true,
      occupation: 'Chief Architect, Indah Jaya',
      education: "ITB Architecture, Class of '96",
      address: 'Bandung, West Java'
    }
  },
  {
    value: 'MEMORIAL_STYLE',
    label: '04. Memorial Style',
    badgeClass: 'bg-zinc-200 text-zinc-700',
    previewHeight: 'h-80',
    member: {
      id: 'memorial-preview',
      fullName: 'Kartini Santoso',
      gender: 'FEMALE',
      birthDate: '1921-01-01',
      deathDate: '2005-01-01',
      isAlive: false
    }
  }
]
</script>

<template>
  <section class="rounded-xl border border-default bg-default p-4">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-base font-semibold text-highlighted">Node Library</h2>
        <p class="text-sm text-muted">Pilih style default untuk tampilan anggota di family tree ini.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="item in settingItems"
          :key="item.key"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-default px-3 py-2 text-xs font-medium transition hover:bg-muted"
          :class="settings[item.key] ? 'text-highlighted' : 'text-muted'"
          @click="toggleSetting(item.key)"
        >
          <UIcon :name="settings[item.key] ? 'i-lucide-check-square' : 'i-lucide-square'" class="size-4" />
          {{ item.label }}
        </button>
        <UButton icon="i-lucide-save" color="primary" :loading="saving" @click="emit('save')">
          Simpan Style
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <button
        v-for="variant in variants"
        :key="variant.value"
        type="button"
        class="group flex flex-col gap-3 rounded-lg border p-3 text-left transition hover:border-primary"
        :class="modelValue === variant.value ? 'border-primary bg-primary/5' : 'border-default bg-muted/20'"
        @click="emit('update:modelValue', variant.value)"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="rounded-full px-3 py-1 text-[11px] font-bold uppercase" :class="variant.badgeClass">
            {{ variant.label }}
          </span>
          <span class="text-xs font-semibold text-primary">
            {{ modelValue === variant.value ? 'Default' : 'Set as Default' }}
          </span>
        </div>

        <div
          class="flex items-center justify-center rounded-lg border border-default bg-white p-6 dark:bg-zinc-950"
          :class="variant.previewHeight"
        >
          <FamilyTreeNode
            :member="variant.member"
            :variant="variant.value"
            :settings="settings"
            :relation-label="variant.relationLabel"
            preview
          />
        </div>
      </button>
    </div>
  </section>
</template>
