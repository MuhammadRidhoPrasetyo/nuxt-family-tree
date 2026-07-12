<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const currentUser = useCurrentUser()
const route = useRoute()
const open = ref(false)

const canManageSiteDonationSettings = computed(() => {
  return currentUser.value?.role === 'ADMIN'
})

const links = computed<NavigationMenuItem[][]>(() => {
  const mainLinks: NavigationMenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/dashboard'
    },
    {
      label: 'Families',
      icon: 'i-lucide-git-fork',
      to: '/families'
    },
    {
      label: 'Anggota',
      icon: 'i-lucide-users',
      to: '/members'
    },
    {
      label: 'Undangan',
      icon: 'i-lucide-send',
      to: '/invitations'
    },
    {
      label: 'Donasi',
      icon: 'i-lucide-heart-handshake',
      to: '/donations'
    }
  ]

  const footerLinks: NavigationMenuItem[] = []

  if (canManageSiteDonationSettings.value) {
    mainLinks.push({
      label: 'Site Donation Settings',
      icon: 'i-lucide-wallet',
      to: '/admin/site-donation-settings'
    })
  }

  footerLinks.push({
    label: 'Help & Support',
    icon: 'i-lucide-info',
    to: 'https://github.com/nuxt-ui-templates/dashboard',
    target: '_blank'
  })

  return [mainLinks, footerLinks]
})

const pageTitle = computed(() => {
  if (route.path === '/dashboard') return 'Dashboard'
  if (route.path.startsWith('/families')) return 'Families'
  if (route.path.startsWith('/members')) return 'Anggota'
  if (route.path.startsWith('/invitations')) return 'Undangan'
  if (route.path.startsWith('/donations')) return 'Donasi'
  if (route.path.startsWith('/admin/site-donation-settings')) return 'Site Donation Settings'
  return 'Dashboard'
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel grow>
      <UDashboardNavbar :title="pageTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UColorModeButton />
          <UDropdownMenu
            v-if="currentUser"
            :items="[
              [
                {
                  type: 'label',
                  label: currentUser.name || 'User',
                  avatar: currentUser.image ? { src: currentUser.image } : { icon: 'i-lucide-user' }
                }
              ]
            ]"
            :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
          >
            <UAvatar
              :src="currentUser.image || undefined"
              :alt="currentUser.name || 'U'"
              size="sm"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-background/50">
        <slot />
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
