<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const currentUser = useCurrentUser()
const route = useRoute()
const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Ke Panel User',
      icon: 'i-lucide-arrow-left',
      to: '/dashboard'
    }
  ],
  [
    {
      label: 'Dashboard Overview',
      icon: 'i-lucide-layout-dashboard',
      to: '/admin'
    },
    {
      label: 'Kelola Users',
      icon: 'i-lucide-users',
      to: '/admin/users'
    },
    {
      label: 'Kelola Roles',
      icon: 'i-lucide-shield',
      to: '/admin/roles'
    },
    {
      label: 'Kelola Permissions',
      icon: 'i-lucide-key',
      to: '/admin/permissions'
    },
    {
      label: 'Kelola User Roles',
      icon: 'i-lucide-user-cog',
      to: '/admin/user-roles'
    },
    {
      label: 'Role Permissions',
      icon: 'i-lucide-settings-2',
      to: '/admin/role-permissions'
    }
  ]
])

const pageTitle = computed(() => {
  if (route.path === '/admin') return 'Dashboard Overview'
  if (route.path.startsWith('/admin/users')) return 'Kelola Users'
  if (route.path.startsWith('/admin/roles')) return 'Kelola Roles'
  if (route.path.startsWith('/admin/permissions')) return 'Kelola Permissions'
  if (route.path.startsWith('/admin/user-roles')) return 'Kelola User Roles'
  if (route.path.startsWith('/admin/role-permissions')) return 'Role Permissions'
  return 'Admin Console'
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="admin"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2.5 min-w-0 px-1 w-full" :class="collapsed ? 'justify-center' : ''">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white font-bold">
            <UIcon name="i-lucide-shield-alert" class="size-4" />
          </div>
          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="text-sm font-semibold leading-none text-highlighted truncate">Admin Console</p>
            <p class="text-xs text-red-500 leading-none mt-1 truncate font-semibold">RBAC Panel</p>
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <USeparator class="my-2" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          popover
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
          <UBadge color="error" variant="subtle" label="Admin" />
        </template>
        <template #right>
          <UColorModeButton />
          <UDropdownMenu
            v-if="currentUser"
            :items="[
              [
                {
                  type: 'label',
                  label: currentUser.name || 'Admin',
                  avatar: currentUser.image ? { src: currentUser.image } : { icon: 'i-lucide-shield-alert' }
                }
              ]
            ]"
            :content="{ side: 'bottom', align: 'end', sideOffset: 8 }"
          >
            <UAvatar
              :src="currentUser.image || undefined"
              :alt="currentUser.name || 'A'"
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
