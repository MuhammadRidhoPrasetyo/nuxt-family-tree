<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { VueFlow } from '@vue-flow/core'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const toast = useToast()

type Family = {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: 'PRIVATE' | 'INVITE_ONLY' | 'PUBLIC'
}

const { data, error } = await useFetch<{ family: Family }>(`/api/families/${route.params.id}`, {
  credentials: 'include'
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Family not found'
  })
}

// Fetch family members & relations
const { data: treeData, refresh: refreshTree } = await useFetch<any>(`/api/families/${route.params.id}/members`, {
  credentials: 'include',
  default: () => ({ members: [], relations: [], marriages: [] })
})

// Visual nodes & edges
const nodes = ref<any[]>([])
const edges = ref<any[]>([])

const generateTreeLayout = () => {
  if (!treeData.value) return

  const members = treeData.value.members || []
  const relations = treeData.value.relations || []
  const marriages = treeData.value.marriages || []

  // Build helper maps
  const childrenOf: Record<string, string[]> = {}
  const parentsOf: Record<string, string[]> = {}
  const partnerOf: Record<string, string> = {}

  members.forEach((m: any) => {
    childrenOf[m.id] = []
    parentsOf[m.id] = []
  })

  relations.forEach((r: any) => {
    const childArr = childrenOf[r.parentId]
    if (childArr) {
      childArr.push(r.childId)
    }
    const parentArr = parentsOf[r.childId]
    if (parentArr) {
      parentArr.push(r.parentId)
    }
  })

  marriages.forEach((m: any) => {
    partnerOf[m.partner1Id] = m.partner2Id
    partnerOf[m.partner2Id] = m.partner1Id
  })

  const positions: Record<string, { x: number, y: number }> = {}
  const visited = new Set<string>()

  // Layout node and its branch recursively
  const layoutNode = (nodeId: string, x: number, y: number) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    positions[nodeId] = { x, y }

    const partnerId = partnerOf[nodeId]
    if (partnerId && !visited.has(partnerId)) {
      visited.add(partnerId)
      positions[partnerId] = { x: x + 200, y } // Place partner at side

      // Get children from both parents
      const allChildren = new Set<string>()
      childrenOf[nodeId]?.forEach(cid => allChildren.add(cid))
      childrenOf[partnerId]?.forEach(cid => allChildren.add(cid))

      const childList = Array.from(allChildren)
      const totalChildren = childList.length
      const startX = x + 100 - ((totalChildren - 1) * 220) / 2

      childList.forEach((cid, idx) => {
        layoutNode(cid, startX + idx * 220, y + 160) // Place children below parents
      })
    } else if (!partnerId) {
      const children = childrenOf[nodeId] || []
      const startX = x - ((children.length - 1) * 220) / 2
      children.forEach((cid, idx) => {
        layoutNode(cid, startX + idx * 220, y + 160) // Place children below parent
      })
    }
  }

  // Find root nodes (no parents)
  const roots = members.filter((m: any) => {
    const parentArr = parentsOf[m.id]
    return !parentArr || parentArr.length === 0
  })
  const initialNodes = roots.length > 0 ? roots : members

  let rootIdx = 0
  initialNodes.forEach((r: any) => {
    if (!visited.has(r.id)) {
      layoutNode(r.id, 250 + rootIdx * 500, 80)
      rootIdx++
    }
  })

  // Position any leftover unvisited nodes
  members.forEach((m: any) => {
    if (!visited.has(m.id)) {
      layoutNode(m.id, 250 + rootIdx * 240, 80)
      rootIdx++
    }
  })

  const mappedNodes = members.map((m: any) => {
    const pos = positions[m.id] || { x: 250, y: 150 }

    let genderColor = '#94a3b8'
    if (m.gender === 'MALE') genderColor = '#3b82f6'
    else if (m.gender === 'FEMALE') genderColor = '#ec4899'

    return {
      id: m.id,
      data: m,
      label: m.fullName,
      position: pos,
      style: {
        border: `2px solid ${genderColor}`,
        background: 'var(--ui-bg-elevated)',
        color: 'var(--ui-text-highlighted)',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '13px',
        fontWeight: '500',
        minWidth: '160px',
        textAlign: 'center'
      }
    }
  })

  const mappedEdges: any[] = []

  // Add parent-child relations
  relations.forEach((r: any) => {
    mappedEdges.push({
      id: `rel-${r.id}`,
      source: r.parentId,
      target: r.childId,
      type: 'smoothstep',
      animated: true
    })
  })

  // Add marriage relations
  marriages.forEach((m: any) => {
    mappedEdges.push({
      id: `marriage-${m.id}`,
      source: m.partner1Id,
      target: m.partner2Id,
      type: 'straight',
      style: { stroke: '#10b981', strokeWidth: 3 }
    })
  })

  nodes.value = mappedNodes
  edges.value = mappedEdges
}

watch(treeData, () => {
  generateTreeLayout()
}, { immediate: true })

// Slideover state & form
const isSlideoverOpen = ref(false)
const selectedNodeId = ref<string | null>(null)
const savingMember = ref(false)

const tabs = [
  { label: 'Dasar', slot: 'basic' },
  { label: 'Lahir & Wafat', slot: 'life' },
  { label: 'Kontak', slot: 'contact' },
  { label: 'Lainnya', slot: 'extra' }
]

const memberForm = reactive({
  fullName: '',
  nickname: '',
  gender: 'UNKNOWN',
  occupation: '',
  education: '',
  religion: '',
  birthPlace: '',
  birthDate: '',
  isAlive: true,
  deathPlace: '',
  deathDate: '',
  phone: '',
  email: '',
  address: '',
  bio: '',
  notesPrivate: '',
  photoUrl: ''
})

const genderItems = [
  { label: 'Laki-laki', value: 'MALE' },
  { label: 'Perempuan', value: 'FEMALE' },
  { label: 'Tidak Diketahui', value: 'UNKNOWN' }
]

const resetForm = () => {
  selectedNodeId.value = null
  memberForm.fullName = ''
  memberForm.nickname = ''
  memberForm.gender = 'UNKNOWN'
  memberForm.occupation = ''
  memberForm.education = ''
  memberForm.religion = ''
  memberForm.birthPlace = ''
  memberForm.birthDate = ''
  memberForm.isAlive = true
  memberForm.deathPlace = ''
  memberForm.deathDate = ''
  memberForm.phone = ''
  memberForm.email = ''
  memberForm.address = ''
  memberForm.bio = ''
  memberForm.notesPrivate = ''
  memberForm.photoUrl = ''
}

const openCreateMode = () => {
  resetForm()
  isSlideoverOpen.value = true
}

const onNodeClick = ({ node }: any) => {
  selectedNodeId.value = node.id
  const member = node.data
  memberForm.fullName = member.fullName || ''
  memberForm.nickname = member.nickname || ''
  memberForm.gender = member.gender || 'UNKNOWN'
  memberForm.occupation = member.occupation || ''
  memberForm.education = member.education || ''
  memberForm.religion = member.religion || ''
  memberForm.birthPlace = member.birthPlace || ''
  memberForm.birthDate = member.birthDate ? member.birthDate.substring(0, 10) : ''
  memberForm.isAlive = member.isAlive !== false
  memberForm.deathPlace = member.deathPlace || ''
  memberForm.deathDate = member.deathDate ? member.deathDate.substring(0, 10) : ''
  memberForm.phone = member.phone || ''
  memberForm.email = member.email || ''
  memberForm.address = member.address || ''
  memberForm.bio = member.bio || ''
  memberForm.notesPrivate = member.notesPrivate || ''
  memberForm.photoUrl = member.photoUrl || ''
  
  isSlideoverOpen.value = true
}

const saveMember = async () => {
  if (!memberForm.fullName.trim()) {
    toast.add({ title: 'Validasi gagal', description: 'Nama Lengkap wajib diisi.', color: 'warning' })
    return
  }

  savingMember.value = true

  try {
    const payload = {
      ...memberForm,
      birthDate: memberForm.birthDate || undefined,
      deathDate: memberForm.isAlive ? undefined : (memberForm.deathDate || undefined),
      deathPlace: memberForm.isAlive ? undefined : (memberForm.deathPlace || undefined)
    }

    if (selectedNodeId.value) {
      // Edit mode
      await $fetch(`/api/families/${route.params.id}/members/${selectedNodeId.value}`, {
        method: 'PATCH',
        body: payload,
        credentials: 'include'
      })
      toast.add({ title: 'Detail anggota diperbarui' })
    } else {
      // Create mode
      await $fetch(`/api/families/${route.params.id}/members`, {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })
      toast.add({ title: 'Anggota keluarga baru ditambahkan' })
    }

    await refreshTree()
    isSlideoverOpen.value = false
    resetForm()
  } catch (err: any) {
    const message = err?.data?.message || err?.message || 'Gagal menyimpan data.'
    toast.add({ title: 'Gagal menyimpan', description: message, color: 'error' })
  } finally {
    savingMember.value = false
  }
}

// Generate relations
const addParents = async () => {
  if (!selectedNodeId.value) return
  savingMember.value = true
  try {
    const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
    const name = selectedMember?.fullName || 'Anggota'

    const fatherRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
      method: 'POST',
      body: { fullName: `Ayah dari ${name}`, gender: 'MALE', isAlive: true },
      credentials: 'include'
    })

    const motherRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
      method: 'POST',
      body: { fullName: `Ibu dari ${name}`, gender: 'FEMALE', isAlive: true },
      credentials: 'include'
    })

    await $fetch(`/api/families/${route.params.id}/relations`, {
      method: 'POST',
      body: { type: 'PARENT_CHILD', parentId: fatherRes.member.id, childId: selectedNodeId.value, parentRole: 'FATHER' },
      credentials: 'include'
    })

    await $fetch(`/api/families/${route.params.id}/relations`, {
      method: 'POST',
      body: { type: 'PARENT_CHILD', parentId: motherRes.member.id, childId: selectedNodeId.value, parentRole: 'MOTHER' },
      credentials: 'include'
    })

    await $fetch(`/api/families/${route.params.id}/relations`, {
      method: 'POST',
      body: { type: 'MARRIAGE', partner1Id: fatherRes.member.id, partner2Id: motherRes.member.id },
      credentials: 'include'
    })

    toast.add({ title: 'Orang tua ditambahkan' })
    await refreshTree()
    isSlideoverOpen.value = false
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' })
  } finally {
    savingMember.value = false
  }
}

const addPartner = async () => {
  if (!selectedNodeId.value) return
  savingMember.value = true
  try {
    const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
    const name = selectedMember?.fullName || 'Anggota'
    const oppGender = selectedMember?.gender === 'MALE' ? 'FEMALE' : selectedMember?.gender === 'FEMALE' ? 'MALE' : 'UNKNOWN'

    const partnerRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
      method: 'POST',
      body: { fullName: `Pasangan dari ${name}`, gender: oppGender, isAlive: true },
      credentials: 'include'
    })

    await $fetch(`/api/families/${route.params.id}/relations`, {
      method: 'POST',
      body: { type: 'MARRIAGE', partner1Id: selectedNodeId.value, partner2Id: partnerRes.member.id },
      credentials: 'include'
    })

    toast.add({ title: 'Pasangan ditambahkan' })
    await refreshTree()
    isSlideoverOpen.value = false
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' })
  } finally {
    savingMember.value = false
  }
}

const addSiblings = async () => {
  if (!selectedNodeId.value) return
  savingMember.value = true
  try {
    const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
    const name = selectedMember?.fullName || 'Anggota'
    const randGender = Math.random() > 0.5 ? 'MALE' : 'FEMALE'

    const siblingRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
      method: 'POST',
      body: { fullName: `Saudara dari ${name}`, gender: randGender, isAlive: true },
      credentials: 'include'
    })

    const parentRelations = treeData.value?.relations.filter((r: any) => r.childId === selectedNodeId.value) || []
    for (const rel of parentRelations) {
      await $fetch(`/api/families/${route.params.id}/relations`, {
        method: 'POST',
        body: { type: 'PARENT_CHILD', parentId: rel.parentId, childId: siblingRes.member.id, parentRole: rel.parentRole },
        credentials: 'include'
      })
    }

    toast.add({ title: 'Saudara ditambahkan' })
    await refreshTree()
    isSlideoverOpen.value = false
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' })
  } finally {
    savingMember.value = false
  }
}

const addChild = async () => {
  if (!selectedNodeId.value) return
  savingMember.value = true
  try {
    const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
    const name = selectedMember?.fullName || 'Anggota'

    const childRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
      method: 'POST',
      body: { fullName: `Anak dari ${name}`, gender: 'UNKNOWN', isAlive: true },
      credentials: 'include'
    })

    const pRole = selectedMember?.gender === 'MALE' ? 'FATHER' : selectedMember?.gender === 'FEMALE' ? 'MOTHER' : 'PARENT'
    await $fetch(`/api/families/${route.params.id}/relations`, {
      method: 'POST',
      body: { type: 'PARENT_CHILD', parentId: selectedNodeId.value, childId: childRes.member.id, parentRole: pRole },
      credentials: 'include'
    })

    toast.add({ title: 'Anak ditambahkan' })
    await refreshTree()
    isSlideoverOpen.value = false
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' })
  } finally {
    savingMember.value = false
  }
}
</script>

<template>
  <div class="h-[calc(100vh-140px)] flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/families" class="text-sm text-muted hover:text-primary transition-colors flex items-center gap-1">
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            Kembali ke Daftar Keluarga
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-semibold text-highlighted mt-1">
          Visualisasi: {{ data?.family.name }}
        </h1>
        <p class="text-xs text-muted">
          /{{ data?.family.slug }} &bull; Visibilitas: {{ data?.family.visibility }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-user-plus" color="primary" @click="openCreateMode">
          Tambah Anggota
        </UButton>
        <UButton :to="`/families/${data?.family.id}/settings`" icon="i-lucide-settings" color="neutral" variant="outline">
          Pengaturan
        </UButton>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden rounded-xl border border-default bg-default relative">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        fit-view-on-init
        class="h-full w-full"
        @node-click="onNodeClick"
      >
        <Background />
        <MiniMap />
        <Controls />
      </VueFlow>
    </div>

    <!-- Slideover (Flyout) Form -->
    <USlideover
      v-model:open="isSlideoverOpen"
      :title="selectedNodeId ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'"
      description="Masukkan data anggota keluarga baru untuk inisiasi awal silsilah."
      :ui="{ content: 'max-w-md sm:max-w-lg' }"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Quick Generate Relations Buttons (Only in Edit/Selected Mode) -->
          <div v-if="selectedNodeId" class="space-y-2 pb-3 border-b border-default">
            <p class="text-xs font-semibold text-highlighted">Hubungkan Relasi Baru:</p>
            <div class="grid grid-cols-2 gap-2">
              <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-users" :loading="savingMember" @click="addParents">
                Add Parents
              </UButton>
              <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-heart" :loading="savingMember" @click="addPartner">
                Add Partner
              </UButton>
              <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-user-check" :loading="savingMember" @click="addSiblings">
                Add Siblings
              </UButton>
              <UButton size="xs" color="neutral" variant="subtle" icon="i-lucide-baby" :loading="savingMember" @click="addChild">
                Add Child
              </UButton>
            </div>
          </div>

          <UTabs :items="tabs" class="w-full">
            <!-- Basic Tab -->
            <template #basic>
              <div class="space-y-4 pt-4">
                <UFormField label="Nama Lengkap" name="fullName" required>
                  <UInput v-model="memberForm.fullName" required placeholder="Masukkan nama lengkap" class="w-full" />
                </UFormField>

                <UFormField label="Nama Panggilan" name="nickname">
                  <UInput v-model="memberForm.nickname" placeholder="Masukkan nama panggilan" class="w-full" />
                </UFormField>

                <UFormField label="Jenis Kelamin" name="gender">
                  <USelect v-model="memberForm.gender" :items="genderItems" class="w-full" />
                </UFormField>

                <UFormField label="Pekerjaan" name="occupation">
                  <UInput v-model="memberForm.occupation" placeholder="PNS, Swasta, dsb" class="w-full" />
                </UFormField>

                <UFormField label="Pendidikan" name="education">
                  <UInput v-model="memberForm.education" placeholder="S1, SMA, dsb" class="w-full" />
                </UFormField>

                <UFormField label="Agama" name="religion">
                  <UInput v-model="memberForm.religion" placeholder="Islam, Kristen, dsb" class="w-full" />
                </UFormField>
              </div>
            </template>

            <!-- Life events Tab -->
            <template #life>
              <div class="space-y-4 pt-4">
                <UFormField label="Tempat Lahir" name="birthPlace">
                  <UInput v-model="memberForm.birthPlace" placeholder="Jakarta, dsb" class="w-full" />
                </UFormField>

                <UFormField label="Tanggal Lahir" name="birthDate">
                  <UInput v-model="memberForm.birthDate" type="date" class="w-full" />
                </UFormField>

                <div class="pt-2">
                  <UCheckbox v-model="memberForm.isAlive" label="Masih Hidup" />
                </div>

                <div v-if="!memberForm.isAlive" class="space-y-4 pt-2">
                  <UFormField label="Tempat Wafat" name="deathPlace">
                    <UInput v-model="memberForm.deathPlace" placeholder="Jakarta, dsb" class="w-full" />
                  </UFormField>

                  <UFormField label="Tanggal Wafat" name="deathDate">
                    <UInput v-model="memberForm.deathDate" type="date" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </template>

            <!-- Contact Tab -->
            <template #contact>
              <div class="space-y-4 pt-4">
                <UFormField label="Nomor Telepon" name="phone">
                  <UInput v-model="memberForm.phone" placeholder="0812xxxxxxxx" class="w-full" />
                </UFormField>

                <UFormField label="Email" name="email">
                  <UInput v-model="memberForm.email" type="email" placeholder="email@domain.com" class="w-full" />
                </UFormField>

                <UFormField label="Alamat Tempat Tinggal" name="address">
                  <UTextarea v-model="memberForm.address" placeholder="Tulis alamat lengkap" :rows="3" class="w-full" />
                </UFormField>
              </div>
            </template>

            <!-- Extra Tab -->
            <template #extra>
              <div class="space-y-4 pt-4">
                <UFormField label="Foto URL" name="photoUrl">
                  <UInput v-model="memberForm.photoUrl" placeholder="https://image-url.com/avatar.jpg" class="w-full" />
                </UFormField>

                <UFormField label="Biografi Singkat" name="bio">
                  <UTextarea v-model="memberForm.bio" placeholder="Tulis biografi singkat mengenai anggota keluarga ini" :rows="3" class="w-full" />
                </UFormField>

                <UFormField label="Catatan Pribadi (Hanya Pemilik)" name="notesPrivate">
                  <UTextarea v-model="memberForm.notesPrivate" placeholder="Catatan internal keluarga yang bersifat rahasia" :rows="3" class="w-full" />
                </UFormField>
              </div>
            </template>
          </UTabs>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton color="neutral" variant="outline" @click="isSlideoverOpen = false">
            Batal
          </UButton>
          <UButton type="submit" icon="i-lucide-save" :loading="savingMember" @click="saveMember">
            Simpan
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
