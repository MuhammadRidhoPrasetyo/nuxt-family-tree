<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})
</script>

<template>
  <div class="min-h-screen bg-muted">
    <div class="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_420px]">
      <section>
        <UBadge color="primary" variant="subtle" class="mb-5">
          Nuxt 4 Family Tree
        </UBadge>
        <h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
          Kelola silsilah keluarga, undangan, media, dan relasi dalam satu dashboard.
        </h1>
        <p class="mt-5 max-w-xl text-lg text-muted">
          Dashboard ini memakai Nuxt UI, Better Auth, Drizzle, PostgreSQL, Zod, dan Vue Flow untuk visualisasi family tree.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <UButton to="/login" icon="i-lucide-log-in" size="lg">
            Login
          </UButton>
          <UButton to="/register" icon="i-lucide-user-plus" color="neutral" variant="outline" size="lg">
            Register
          </UButton>
        </div>
      </section>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted">
                Preview
              </p>
              <h2 class="text-lg font-semibold text-highlighted">
                Family Tree Workspace
              </h2>
            </div>
            <UIcon name="i-lucide-git-fork" class="size-5 text-primary" />
          </div>
        </template>

        <div class="space-y-4">
          <div v-for="item in ['Keluarga Santoso', '28 anggota', '4 undangan aktif']" :key="item" class="flex items-center gap-3 rounded-lg border border-default p-3">
            <UIcon name="i-lucide-circle-check" class="size-5 text-primary" />
            <span class="text-sm font-medium">{{ item }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
