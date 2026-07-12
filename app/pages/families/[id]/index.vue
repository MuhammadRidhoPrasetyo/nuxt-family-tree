<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { VueFlow, Handle, Position } from '@vue-flow/core'
import FamilyTreeNode from '~/components/family-tree/FamilyTreeNode.vue'

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
  ownerUserId: string
}

type NodeViewMode = 'CLASSIC_CARD' | 'COMPACT_MINIMAL' | 'DETAILED_PROFILE' | 'MEMORIAL_STYLE'
type TreeNodeSettings = {
  showPhotos: boolean
  showBirthDates: boolean
  showNicknames: boolean
  colorByGender: boolean
}
type TreePreferences = TreeNodeSettings & {
  nodeViewMode: NodeViewMode
}
type NodePreference = Partial<TreeNodeSettings> & {
  memberId: string
  nodeViewMode?: NodeViewMode | null
}

const defaultTreePreferences: TreePreferences = {
  nodeViewMode: 'CLASSIC_CARD',
  showPhotos: true,
  showBirthDates: true,
  showNicknames: true,
  colorByGender: true
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
  default: () => ({ members: [], relations: [], marriages: [], preferences: defaultTreePreferences, nodePreferences: [] })
})

// Visual nodes & edges
const nodes = ref<any[]>([])
const edges = ref<any[]>([])
const selectedNodePreferenceMode = ref<NodeViewMode | 'INHERIT'>('INHERIT')
const savingNodePreference = ref(false)
const nodePreferences = ref<NodePreference[]>([])

const treePreferences = reactive<TreePreferences>({ ...defaultTreePreferences })

const nodePreferenceModeItems = [
  { label: 'Ikuti default tree', value: 'INHERIT' },
  { label: 'Classic Card', value: 'CLASSIC_CARD' },
  { label: 'Compact / Minimal', value: 'COMPACT_MINIMAL' },
  { label: 'Detailed Profile', value: 'DETAILED_PROFILE' },
  { label: 'Memorial Style', value: 'MEMORIAL_STYLE' }
]

const nodePreferenceMap = computed(() => {
  const map = new Map<string, NodePreference>()
  nodePreferences.value.forEach((preference: NodePreference) => {
    map.set(preference.memberId, preference)
  })
  return map
})

const applyTreePreferencesFromResponse = () => {
  const preferences = treeData.value?.preferences || defaultTreePreferences
  treePreferences.nodeViewMode = preferences.nodeViewMode || defaultTreePreferences.nodeViewMode
  treePreferences.showPhotos = preferences.showPhotos ?? defaultTreePreferences.showPhotos
  treePreferences.showBirthDates = preferences.showBirthDates ?? defaultTreePreferences.showBirthDates
  treePreferences.showNicknames = preferences.showNicknames ?? defaultTreePreferences.showNicknames
  treePreferences.colorByGender = preferences.colorByGender ?? defaultTreePreferences.colorByGender
}

const getEffectiveNodeConfig = (memberId: string) => {
  const nodePreference = nodePreferenceMap.value.get(memberId)
  return {
    nodeViewMode: nodePreference?.nodeViewMode || treePreferences.nodeViewMode,
    settings: {
      showPhotos: nodePreference?.showPhotos ?? treePreferences.showPhotos,
      showBirthDates: nodePreference?.showBirthDates ?? treePreferences.showBirthDates,
      showNicknames: nodePreference?.showNicknames ?? treePreferences.showNicknames,
      colorByGender: nodePreference?.colorByGender ?? treePreferences.colorByGender
    }
  }
}

const getRelationLabel = (memberId: string, relations: any[]) => {
  const relation = relations.find((item: any) => item.childId === memberId)
  if (!relation) return 'Anggota Keluarga'
  if (relation.parentRole === 'FATHER') return 'Ayah'
  if (relation.parentRole === 'MOTHER') return 'Ibu'
  if (relation.parentRole === 'GUARDIAN') return 'Wali'
  return 'Orang Tua'
}

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

  // Load saved positions from database
  members.forEach((m: any) => {
    if (m.positionX !== null && m.positionY !== null && m.positionX !== undefined && m.positionY !== undefined) {
      positions[m.id] = { x: m.positionX, y: m.positionY }
      visited.add(m.id)
    }
  })

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
    const nodeConfig = getEffectiveNodeConfig(m.id)

    return {
      id: m.id,
      type: 'custom',
      data: {
        ...m,
        nodeViewMode: nodeConfig.nodeViewMode,
        nodeSettings: nodeConfig.settings,
        relationLabel: getRelationLabel(m.id, relations)
      },
      label: m.fullName,
      position: pos
    }
  })

  const mappedEdges: any[] = []

  // Add parent-child relations
  relations.forEach((r: any) => {
    mappedEdges.push({
      id: `rel-${r.id}`,
      source: r.parentId,
      target: r.childId,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'smoothstep',
      animated: true
    })
  })

  // Add marriage relations
  marriages.forEach((m: any) => {
    const p1Pos = positions[m.partner1Id]
    const p2Pos = positions[m.partner2Id]
    let sourceHandle = 'right-source'
    let targetHandle = 'left-target'

    if (p1Pos && p2Pos) {
      if (p1Pos.x > p2Pos.x) {
        sourceHandle = 'left-source'
        targetHandle = 'right-target'
      } else {
        sourceHandle = 'right-source'
        targetHandle = 'left-target'
      }
    }

    mappedEdges.push({
      id: `marriage-${m.id}`,
      source: m.partner1Id,
      target: m.partner2Id,
      sourceHandle,
      targetHandle,
      type: 'straight',
      style: { stroke: '#10b981', strokeWidth: 3 }
    })
  })

  nodes.value = mappedNodes
  edges.value = mappedEdges
}

watch(treeData, () => {
  applyTreePreferencesFromResponse()
  nodePreferences.value = [...(treeData.value?.nodePreferences || [])]
  generateTreeLayout()
}, { immediate: true })

watch(treePreferences, () => {
  generateTreeLayout()
})

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
  selectedNodePreferenceMode.value = nodePreferenceMap.value.get(node.id)?.nodeViewMode || 'INHERIT'
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

const saveSelectedNodePreference = async () => {
  if (!selectedNodeId.value) return
  savingNodePreference.value = true
  try {
    const res = await $fetch<{ preference: NodePreference }>(`/api/families/${route.params.id}/members/${selectedNodeId.value}/tree-preference`, {
      method: 'PATCH',
      body: {
        nodeViewMode: selectedNodePreferenceMode.value === 'INHERIT' ? null : selectedNodePreferenceMode.value
      },
      credentials: 'include'
    })
    if (treeData.value) {
      nodePreferences.value = [
        ...nodePreferences.value.filter((preference: NodePreference) => preference.memberId !== selectedNodeId.value),
        res.preference
      ]
      treeData.value.nodePreferences = nodePreferences.value
    }
    generateTreeLayout()
    toast.add({ title: 'Style node berhasil disimpan', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Gagal menyimpan style node', description: err.data?.message || err.message, color: 'error' })
  } finally {
    savingNodePreference.value = false
  }
}

const clearSelectedNodePreference = async () => {
  if (!selectedNodeId.value) return
  savingNodePreference.value = true
  try {
    await $fetch(`/api/families/${route.params.id}/members/${selectedNodeId.value}/tree-preference`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (treeData.value) {
      nodePreferences.value = nodePreferences.value
        .filter((preference: NodePreference) => preference.memberId !== selectedNodeId.value)
      treeData.value.nodePreferences = nodePreferences.value
    }
    selectedNodePreferenceMode.value = 'INHERIT'
    generateTreeLayout()
    toast.add({ title: 'Override style node dihapus', color: 'success' })
  } catch (err: any) {
    toast.add({ title: 'Gagal menghapus override style', description: err.data?.message || err.message, color: 'error' })
  } finally {
    savingNodePreference.value = false
  }
}

const onNodeDragStop = async ({ node }: any) => {
  if (!node) return

  // Update locally
  const member = treeData.value?.members?.find((m: any) => m.id === node.id)
  if (member) {
    member.positionX = Math.round(node.position.x)
    member.positionY = Math.round(node.position.y)
  }

  try {
    await $fetch(`/api/families/${route.params.id}/members/positions`, {
      method: 'PATCH',
      body: {
        positions: [
          {
            id: node.id,
            x: Math.round(node.position.x),
            y: Math.round(node.position.y)
          }
        ]
      }
    })
  } catch (err: any) {
    toast.add({
      title: 'Gagal menyimpan posisi',
      description: err.message || 'Terjadi kesalahan.',
      color: 'error'
    })
  }
}

const uploadingPhoto = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: 'Ukuran file terlalu besar',
      description: 'Maksimal ukuran foto adalah 2MB.',
      color: 'warning'
    })
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  uploadingPhoto.value = true
  try {
    const res = await $fetch<{ url: string }>(`/api/families/${route.params.id}/members/upload`, {
      method: 'POST',
      body: formData
    })
    memberForm.photoUrl = res.url
    toast.add({
      title: 'Foto berhasil diunggah',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Gagal mengunggah foto',
      description: err.message || 'Terjadi kesalahan.',
      color: 'error'
    })
  } finally {
    uploadingPhoto.value = false
  }
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

const deleteMember = async () => {
  if (!selectedNodeId.value) return
  if (!confirm('Hapus anggota keluarga ini beserta seluruh relasinya?')) return

  try {
    await $fetch(`/api/families/${route.params.id}/members/${selectedNodeId.value}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    toast.add({ title: 'Anggota keluarga berhasil dihapus', color: 'success' })
    await refreshTree()
    isSlideoverOpen.value = false
    resetForm()
  } catch (err: any) {
    toast.add({ title: 'Gagal menghapus anggota', description: err.data?.message || err.message, color: 'error' })
  }
}

// Audit Logs
const isAuditLogModalOpen = ref(false)
const loadingAuditLogs = ref(false)
const auditLogsList = ref<any[]>([])

const openAuditLogModal = async () => {
  isAuditLogModalOpen.value = true
  await fetchAuditLogs()
}

const fetchAuditLogs = async () => {
  loadingAuditLogs.value = true
  try {
    const res = await $fetch<{ logs: any[] }>(`/api/families/${route.params.id}/audit-logs`, {
      credentials: 'include'
    })
    auditLogsList.value = res.logs
  } catch (err: any) {
    toast.add({ title: 'Gagal memuat log aktivitas', description: err.data?.message || err.message, color: 'error' })
  } finally {
    loadingAuditLogs.value = false
  }
}

const formatLogMessage = (log: any) => {
  const userName = log.user?.name || 'Seseorang'
  const action = log.action
  const targetName = log.newValue?.fullName || log.oldValue?.fullName || 'anggota keluarga'

  switch (action) {
    case 'CREATE_MEMBER':
      return `${userName} menambahkan anggota baru "${targetName}"`
    case 'UPDATE_MEMBER':
      return `${userName} memperbarui informasi "${targetName}"`
    case 'DELETE_MEMBER':
      return `${userName} menghapus anggota "${targetName}"`
    default:
      return `${userName} melakukan aksi ${action} pada ${targetName}`
  }
}

// Invitations (Kolaborasi)
const currentUser = useCurrentUser()
const isOwnerOrAdmin = computed(() => {
  if (!data.value?.family || !currentUser.value) return false
  return data.value.family.ownerUserId === currentUser.value.id
})

const isInvitationModalOpen = ref(false)
const searchEmail = ref('')
const searchingEmail = ref(false)
const searchResultUser = ref<any>(null)
const searchError = ref('')
const invitationRole = ref<'EDITOR' | 'VIEWER'>('VIEWER')
const sendingInvitation = ref(false)
const loadingCollaborators = ref(false)

const collaborators = ref<{ active: any[], pending: any[] }>({
  active: [],
  pending: []
})

const openInvitationModal = async () => {
  isInvitationModalOpen.value = true
  searchEmail.value = ''
  searchResultUser.value = null
  searchError.value = ''
  invitationRole.value = 'VIEWER'
  await fetchCollaborators()
}

const fetchCollaborators = async () => {
  loadingCollaborators.value = true
  try {
    const res = await $fetch<any>(`/api/families/${route.params.id}/collaborators`)
    collaborators.value = {
      active: res.active || [],
      pending: res.pending || []
    }
  } catch (err: any) {
    toast.add({ title: 'Gagal mengambil daftar kolaborator', description: err.message, color: 'error' })
  } finally {
    loadingCollaborators.value = false
  }
}

const handleSearchUser = async () => {
  if (!searchEmail.value.trim()) return
  searchingEmail.value = true
  searchError.value = ''
  searchResultUser.value = null
  try {
    const res = await $fetch<{ user: any }>(`/api/users/search`, {
      query: { email: searchEmail.value.trim() }
    })
    if (res.user) {
      searchResultUser.value = res.user
    } else {
      searchError.value = 'User tidak ditemukan.'
    }
  } catch (err: any) {
    searchError.value = err.message || 'Terjadi kesalahan.'
  } finally {
    searchingEmail.value = false
  }
}

const sendInvitation = async () => {
  if (!searchResultUser.value) return
  sendingInvitation.value = true
  try {
    await $fetch(`/api/families/${route.params.id}/collaborators`, {
      method: 'POST',
      body: {
        email: searchResultUser.value.email,
        role: invitationRole.value
      }
    })
    toast.add({ title: 'Undangan berhasil dikirim', color: 'success' })
    searchEmail.value = ''
    searchResultUser.value = null
    await fetchCollaborators()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengirim undangan', description: err.data?.message || err.message, color: 'error' })
  } finally {
    sendingInvitation.value = false
  }
}

const updateCollaboratorRole = async (id: string, type: 'ACTIVE' | 'PENDING', newRole: 'EDITOR' | 'VIEWER') => {
  try {
    await $fetch(`/api/families/${route.params.id}/collaborators`, {
      method: 'PATCH',
      body: { id, type, role: newRole }
    })
    toast.add({ title: 'Peran berhasil diperbarui', color: 'success' })
    await fetchCollaborators()
  } catch (err: any) {
    toast.add({ title: 'Gagal memperbarui peran', description: err.data?.message || err.message, color: 'error' })
  }
}

const removeCollaborator = async (id: string, type: 'ACTIVE' | 'PENDING') => {
  const confirmMsg = type === 'ACTIVE' 
    ? 'Hapus kolaborator ini dari keluarga? Mereka tidak akan bisa melihat/mengedit lagi.' 
    : 'Batalkan undangan kolaborasi ini?'
  if (!confirm(confirmMsg)) return

  try {
    await $fetch(`/api/families/${route.params.id}/collaborators`, {
      method: 'DELETE',
      body: { id, type }
    })
    toast.add({ title: type === 'ACTIVE' ? 'Kolaborator dihapus' : 'Undangan dibatalkan', color: 'success' })
    await fetchCollaborators()
  } catch (err: any) {
    toast.add({ title: 'Gagal menghapus', description: err.data?.message || err.message, color: 'error' })
  }
}

// Generate relations
const isRelationModalOpen = ref(false)
const relationTypeToAdd = ref<'parents' | 'partner' | 'sibling' | 'child' | null>(null)
const relationModalTitle = ref('')
const savingRelation = ref(false)

const relationForm = reactive({
  fullName: '',
  gender: 'UNKNOWN',
  fatherName: '',
  motherName: '',
  selectedPartnerId: ''
})

const availablePartners = computed(() => {
  if (!selectedNodeId.value || !treeData.value) return []
  
  const marriagesList = treeData.value.marriages || []
  const membersList = treeData.value.members || []
  
  const spouseIds = marriagesList
    .filter((m: any) => m.partner1Id === selectedNodeId.value || m.partner2Id === selectedNodeId.value)
    .map((m: any) => m.partner1Id === selectedNodeId.value ? m.partner2Id : m.partner1Id)
    
  return spouseIds
    .map((id: string) => membersList.find((m: any) => m.id === id))
    .filter(Boolean) as Array<{ id: string, fullName: string }>
})

const childPartnerOptions = computed(() => {
  return [
    { label: 'Tidak Diketahui / Lainnya', value: '' },
    ...availablePartners.value.map(p => ({ label: p.fullName, value: p.id }))
  ]
})

const openAddParentsModal = () => {
  const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
  const name = selectedMember?.fullName || 'Anggota'
  
  relationTypeToAdd.value = 'parents'
  relationModalTitle.value = 'Tambah Orang Tua'
  relationForm.fatherName = `Ayah dari ${name}`
  relationForm.motherName = `Ibu dari ${name}`
  isSlideoverOpen.value = false
  isRelationModalOpen.value = true
}

const openAddPartnerModal = () => {
  const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
  const name = selectedMember?.fullName || 'Anggota'
  const oppGender = selectedMember?.gender === 'MALE' ? 'FEMALE' : selectedMember?.gender === 'FEMALE' ? 'MALE' : 'UNKNOWN'

  relationTypeToAdd.value = 'partner'
  relationModalTitle.value = 'Tambah Pasangan'
  relationForm.fullName = `Pasangan dari ${name}`
  relationForm.gender = oppGender
  isSlideoverOpen.value = false
  isRelationModalOpen.value = true
}

const openAddSiblingModal = () => {
  const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
  const name = selectedMember?.fullName || 'Anggota'

  relationTypeToAdd.value = 'sibling'
  relationModalTitle.value = 'Tambah Saudara'
  relationForm.fullName = `Saudara dari ${name}`
  relationForm.gender = 'UNKNOWN'
  isSlideoverOpen.value = false
  isRelationModalOpen.value = true
}

const openAddChildModal = () => {
  const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
  const name = selectedMember?.fullName || 'Anggota'

  relationTypeToAdd.value = 'child'
  relationModalTitle.value = 'Tambah Anak'
  relationForm.fullName = `Anak dari ${name}`
  relationForm.gender = 'UNKNOWN'
  
  // Set default partner if available
  const partners = availablePartners.value
  if (partners.length >= 1 && partners[0]) {
    relationForm.selectedPartnerId = partners[0].id
  } else {
    relationForm.selectedPartnerId = ''
  }
  
  isSlideoverOpen.value = false
  isRelationModalOpen.value = true
}

// Watch relation modal state to reopen slideover when cancelled/closed without saving
watch(isRelationModalOpen, (isOpen) => {
  if (!isOpen && selectedNodeId.value && !savingRelation.value) {
    isSlideoverOpen.value = true
  }
})

const submitRelation = async () => {
  if (!selectedNodeId.value) return
  savingRelation.value = true
  try {
    const selectedMember = treeData.value?.members.find((m: any) => m.id === selectedNodeId.value)
    
    if (relationTypeToAdd.value === 'parents') {
      if (!relationForm.fatherName.trim() || !relationForm.motherName.trim()) {
        toast.add({ title: 'Validasi gagal', description: 'Nama Ayah & Ibu wajib diisi.', color: 'warning' })
        savingRelation.value = false
        return
      }

      const fatherRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
        method: 'POST',
        body: { fullName: relationForm.fatherName.trim(), gender: 'MALE', isAlive: true },
        credentials: 'include'
      })

      const motherRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
        method: 'POST',
        body: { fullName: relationForm.motherName.trim(), gender: 'FEMALE', isAlive: true },
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

      toast.add({ title: 'Orang tua berhasil ditambahkan', color: 'success' })
    } 
    
    else if (relationTypeToAdd.value === 'partner') {
      if (!relationForm.fullName.trim()) {
        toast.add({ title: 'Validasi gagal', description: 'Nama Pasangan wajib diisi.', color: 'warning' })
        savingRelation.value = false
        return
      }

      const partnerRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
        method: 'POST',
        body: { fullName: relationForm.fullName.trim(), gender: relationForm.gender, isAlive: true },
        credentials: 'include'
      })

      await $fetch(`/api/families/${route.params.id}/relations`, {
        method: 'POST',
        body: { type: 'MARRIAGE', partner1Id: selectedNodeId.value, partner2Id: partnerRes.member.id },
        credentials: 'include'
      })

      toast.add({ title: 'Pasangan berhasil ditambahkan', color: 'success' })
    } 
    
    else if (relationTypeToAdd.value === 'sibling') {
      if (!relationForm.fullName.trim()) {
        toast.add({ title: 'Validasi gagal', description: 'Nama Saudara wajib diisi.', color: 'warning' })
        savingRelation.value = false
        return
      }

      const siblingRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
        method: 'POST',
        body: { fullName: relationForm.fullName.trim(), gender: relationForm.gender, isAlive: true },
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

      toast.add({ title: 'Saudara berhasil ditambahkan', color: 'success' })
    } 
    
    else if (relationTypeToAdd.value === 'child') {
      if (!relationForm.fullName.trim()) {
        toast.add({ title: 'Validasi gagal', description: 'Nama Anak wajib diisi.', color: 'warning' })
        savingRelation.value = false
        return
      }

      const childRes = await $fetch<{ member: { id: string } }>(`/api/families/${route.params.id}/members`, {
        method: 'POST',
        body: { fullName: relationForm.fullName.trim(), gender: relationForm.gender, isAlive: true },
        credentials: 'include'
      })

      const pRole = selectedMember?.gender === 'MALE' ? 'FATHER' : selectedMember?.gender === 'FEMALE' ? 'MOTHER' : 'PARENT'
      await $fetch(`/api/families/${route.params.id}/relations`, {
        method: 'POST',
        body: { type: 'PARENT_CHILD', parentId: selectedNodeId.value, childId: childRes.member.id, parentRole: pRole },
        credentials: 'include'
      })

      // Link to selected partner (second parent) if provided
      if (relationForm.selectedPartnerId) {
        const partner = treeData.value?.members.find((m: any) => m.id === relationForm.selectedPartnerId)
        const partnerRole = partner?.gender === 'MALE' ? 'FATHER' : partner?.gender === 'FEMALE' ? 'MOTHER' : 'PARENT'
        await $fetch(`/api/families/${route.params.id}/relations`, {
          method: 'POST',
          body: { type: 'PARENT_CHILD', parentId: relationForm.selectedPartnerId, childId: childRes.member.id, parentRole: partnerRole },
          credentials: 'include'
        })
      }

      toast.add({ title: 'Anak berhasil ditambahkan', color: 'success' })
    }

    isRelationModalOpen.value = false
    isSlideoverOpen.value = false
    relationTypeToAdd.value = null
    relationForm.fullName = ''
    relationForm.gender = 'UNKNOWN'
    relationForm.fatherName = ''
    relationForm.motherName = ''
    relationForm.selectedPartnerId = ''
    await refreshTree()
  } catch (err: any) {
    toast.add({ title: 'Gagal menambahkan relasi', description: err?.message, color: 'error' })
  } finally {
    savingRelation.value = false
  }
}
</script>

<template>
  <div class="h-[calc(100vh-140px)] flex flex-col gap-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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

      <div class="flex flex-wrap items-center gap-2">
        <UButton icon="i-lucide-user-plus" color="primary" @click="openCreateMode">
          Tambah Anggota
        </UButton>
        <UButton icon="i-lucide-history" color="neutral" variant="outline" @click="openAuditLogModal">
          Log Aktivitas
        </UButton>
        <UButton v-if="isOwnerOrAdmin" icon="i-lucide-share-2" color="neutral" variant="outline" @click="openInvitationModal">
          Undangan
        </UButton>
        <UButton :to="`/families/${data?.family.id}/settings`" icon="i-lucide-settings" color="neutral" variant="outline">
          Pengaturan
        </UButton>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden rounded-xl border border-default bg-default relative">
      <ClientOnly>
        <VueFlow
          :nodes="nodes"
          :edges="edges"
          fit-view-on-init
          class="h-full w-full"
          @node-click="onNodeClick"
          @node-drag-stop="onNodeDragStop"
        >
          <template #node-custom="{ data }">
            <div class="relative transition-all duration-200">
              <FamilyTreeNode
                :member="data"
                :variant="data.nodeViewMode"
                :settings="data.nodeSettings"
                :relation-label="data.relationLabel"
              />

              <!-- Standard Top/Bottom handles for parent-child relations -->
              <Handle type="target" :position="Position.Top" id="top" style="background: #94a3b8;" />
              <Handle type="source" :position="Position.Bottom" id="bottom" style="background: #94a3b8;" />

              <!-- Left side handles for partner connections -->
              <Handle type="source" :position="Position.Left" id="left-source" style="background: #10b981;" />
              <Handle type="target" :position="Position.Left" id="left-target" style="background: #10b981;" />

              <!-- Right side handles for partner connections -->
              <Handle type="source" :position="Position.Right" id="right-source" style="background: #10b981;" />
              <Handle type="target" :position="Position.Right" id="right-target" style="background: #10b981;" />
            </div>
          </template>
          <Background />
          <MiniMap />
          <Controls />
        </VueFlow>
      </ClientOnly>
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
          <div v-if="selectedNodeId" class="space-y-3 pb-4 border-b border-default">
            <div class="space-y-3">
              <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tampilan Node</p>
              <div class="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <UFormField label="Variant">
                  <USelect v-model="selectedNodePreferenceMode" :items="nodePreferenceModeItems" class="w-full" />
                </UFormField>
                <UButton
                  icon="i-lucide-save"
                  color="primary"
                  variant="soft"
                  :loading="savingNodePreference"
                  @click="saveSelectedNodePreference"
                >
                  Simpan
                </UButton>
                <UButton
                  icon="i-lucide-rotate-ccw"
                  color="neutral"
                  variant="outline"
                  :loading="savingNodePreference"
                  @click="clearSelectedNodePreference"
                >
                  Reset
                </UButton>
              </div>
            </div>

            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hubungkan Relasi Baru</p>
            <div class="grid grid-cols-2 gap-3">
              <!-- Orang Tua -->
              <button 
                type="button"
                @click="openAddParentsModal"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border border-default bg-elevated hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div class="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <UIcon name="i-lucide-users" class="size-5" />
                </div>
                <div class="text-xs font-semibold text-highlighted">Orang Tua</div>
              </button>

              <!-- Pasangan -->
              <button 
                type="button"
                @click="openAddPartnerModal"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border border-default bg-elevated hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div class="size-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                  <UIcon name="i-lucide-heart" class="size-5" />
                </div>
                <div class="text-xs font-semibold text-highlighted">Pasangan</div>
              </button>

              <!-- Saudara -->
              <button 
                type="button"
                @click="openAddSiblingModal"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border border-default bg-elevated hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div class="size-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <UIcon name="i-lucide-user-check" class="size-5" />
                </div>
                <div class="text-xs font-semibold text-highlighted">Saudara</div>
              </button>

              <!-- Anak -->
              <button 
                type="button"
                @click="openAddChildModal"
                class="flex flex-col items-center gap-2 p-3 rounded-xl border border-default bg-elevated hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all text-center group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div class="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <UIcon name="i-lucide-baby" class="size-5" />
                </div>
                <div class="text-xs font-semibold text-highlighted">Anak</div>
              </button>
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
                <UFormField label="Foto Anggota" name="photoUpload">
                  <div class="flex items-center gap-3">
                    <UAvatar v-slot v-if="memberForm.photoUrl" :src="memberForm.photoUrl" size="lg" class="border border-default" />
                    <div v-else class="size-12 rounded-full bg-default flex items-center justify-center border border-default text-muted">
                      <UIcon name="i-lucide-user" class="size-6" />
                    </div>
                    <div class="flex-1 space-y-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        class="hidden" 
                        ref="fileInputRef" 
                        @change="handleFileUpload" 
                      />
                      <div class="flex gap-2">
                        <UButton 
                          type="button" 
                          size="xs" 
                          color="neutral" 
                          variant="outline" 
                          icon="i-lucide-upload" 
                          :loading="uploadingPhoto" 
                          @click="fileInputRef?.click()"
                        >
                          Pilih Foto
                        </UButton>
                        <UButton 
                          v-if="memberForm.photoUrl" 
                          type="button" 
                          size="xs" 
                          color="error" 
                          variant="subtle" 
                          icon="i-lucide-trash" 
                          @click="memberForm.photoUrl = ''"
                        >
                          Hapus
                        </UButton>
                      </div>
                      <p class="text-[10px] text-muted">Format: JPG, PNG, WEBP (Maks. 2MB)</p>
                    </div>
                  </div>
                </UFormField>

                <UFormField label="Atau Gunakan URL Foto" name="photoUrl">
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
        <div class="flex justify-between items-center w-full">
          <div>
            <UButton 
              v-if="selectedNodeId" 
              color="error" 
              variant="subtle" 
              icon="i-lucide-trash-2"
              @click="deleteMember"
            >
              Hapus Anggota
            </UButton>
          </div>
          <div class="flex gap-3">
            <UButton color="neutral" variant="outline" @click="isSlideoverOpen = false">
              Batal
            </UButton>
            <UButton type="submit" icon="i-lucide-save" :loading="savingMember" @click="saveMember">
              Simpan
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Modal Interaktif Hubungan Relasi -->
    <UModal v-model:open="isRelationModalOpen" :title="relationModalTitle" description="Masukkan informasi nama untuk anggota keluarga baru yang akan ditambahkan.">
      <template #body>
        <div class="space-y-4 pt-2">
          <div v-if="relationTypeToAdd === 'parents'" class="space-y-4">
            <UFormField label="Nama Ayah" required>
              <UInput v-model="relationForm.fatherName" placeholder="Masukkan nama lengkap ayah" class="w-full" />
            </UFormField>
            <UFormField label="Nama Ibu" required>
              <UInput v-model="relationForm.motherName" placeholder="Masukkan nama lengkap ibu" class="w-full" />
            </UFormField>
          </div>

          <div v-else class="space-y-4">
            <UFormField label="Nama Lengkap" required>
              <UInput v-model="relationForm.fullName" placeholder="Masukkan nama lengkap" class="w-full" />
            </UFormField>
            <UFormField label="Jenis Kelamin">
              <USelect v-model="relationForm.gender" :items="genderItems" class="w-full" />
            </UFormField>
            <UFormField 
              v-if="relationTypeToAdd === 'child' && availablePartners.length > 0" 
              label="Pilih Orang Tua Kedua (Pasangan)"
            >
              <USelect 
                v-model="relationForm.selectedPartnerId" 
                :items="childPartnerOptions" 
                class="w-full" 
              />
            </UFormField>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton color="neutral" variant="outline" @click="isRelationModalOpen = false">
            Batal
          </UButton>
          <UButton color="primary" :loading="savingRelation" @click="submitRelation">
            Tambah Relasi
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Modal Undang Kolaborator -->
    <UModal v-model:open="isInvitationModalOpen" title="Undang Kolaborator" description="Undang pengguna lain untuk berkolaborasi mengedit atau melihat silsilah keluarga ini." :ui="{ content: 'max-w-lg' }">
      <template #body>
        <div class="space-y-6 pt-2">
          <!-- Search and Invite Area -->
          <div class="space-y-3 p-3.5 rounded-xl border border-default bg-elevated/40">
            <h3 class="text-xs font-semibold text-highlighted uppercase tracking-wider">Kirim Undangan Baru</h3>
            <div class="flex gap-2">
              <UInput 
                v-model="searchEmail" 
                placeholder="Masukkan email pengguna terdaftar" 
                type="email"
                class="flex-1"
                @keyup.enter="handleSearchUser"
              />
              <UButton 
                color="primary" 
                :loading="searchingEmail" 
                icon="i-lucide-search"
                @click="handleSearchUser"
              >
                Cari
              </UButton>
            </div>

            <!-- Search Result States -->
            <div v-if="searchError" class="p-3 text-xs text-error bg-error/10 rounded-lg flex items-center gap-2">
              <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0" />
              <span>{{ searchError }}</span>
            </div>

            <div v-if="searchResultUser" class="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1 flex items-center gap-2.5">
                <UAvatar :src="searchResultUser.image" :alt="searchResultUser.name" size="sm" />
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-highlighted truncate">{{ searchResultUser.name }}</p>
                  <p class="text-xs text-muted truncate">{{ searchResultUser.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <USelect 
                  v-model="invitationRole" 
                  :items="[
                    { label: 'Viewer', value: 'VIEWER' },
                    { label: 'Editor', value: 'EDITOR' }
                  ]"
                  size="xs"
                  class="w-24"
                />
                <UButton 
                  color="primary" 
                  size="xs"
                  icon="i-lucide-send"
                  :loading="sendingInvitation"
                  @click="sendInvitation"
                >
                  Undang
                </UButton>
              </div>
            </div>
          </div>

          <!-- Collaborators List -->
          <div class="space-y-3">
            <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daftar Kolaborator & Undangan</h3>
            
            <div v-if="loadingCollaborators" class="space-y-2">
              <USkeleton v-for="i in 2" :key="i" class="h-12 w-full" />
            </div>

            <div v-else-if="!collaborators.active.length && !collaborators.pending.length" class="text-center py-6 text-sm text-muted">
              Belum ada kolaborator yang diundang.
            </div>

            <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
              <!-- Active Collaborators -->
              <div 
                v-for="collab in collaborators.active" 
                :key="collab.id"
                class="flex items-center justify-between p-2.5 rounded-lg border border-default bg-elevated/20 text-xs gap-3"
              >
                <div class="min-w-0 flex-1 flex items-center gap-2">
                  <UAvatar :src="collab.image" :alt="collab.name" size="xs" />
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="font-semibold text-highlighted truncate">{{ collab.name }}</p>
                      <UBadge size="xs" variant="subtle" color="success">Aktif</UBadge>
                    </div>
                    <p class="text-muted truncate">{{ collab.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <USelect 
                    :model-value="collab.role"
                    :items="[
                      { label: 'Viewer', value: 'VIEWER' },
                      { label: 'Editor', value: 'EDITOR' }
                    ]"
                    size="xs"
                    class="w-24"
                    @update:model-value="(val) => updateCollaboratorRole(collab.id, 'ACTIVE', val as any)"
                  />
                  <UButton 
                    icon="i-lucide-trash" 
                    color="error" 
                    variant="subtle" 
                    size="xs"
                    @click="removeCollaborator(collab.id, 'ACTIVE')"
                  />
                </div>
              </div>

              <!-- Pending Invitations -->
              <div 
                v-for="invite in collaborators.pending" 
                :key="invite.id"
                class="flex items-center justify-between p-2.5 rounded-lg border border-default border-dashed bg-elevated/10 text-xs gap-3"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p class="font-semibold text-highlighted truncate">{{ invite.email }}</p>
                    <UBadge size="xs" variant="subtle" color="warning">Tertunda</UBadge>
                  </div>
                  <p class="text-muted truncate">Kedaluwarsa: {{ new Date(invite.expiredAt).toLocaleDateString('id-ID') }}</p>
                </div>
                <div class="flex items-center gap-1.5">
                  <USelect 
                    :model-value="invite.role"
                    :items="[
                      { label: 'Viewer', value: 'VIEWER' },
                      { label: 'Editor', value: 'EDITOR' }
                    ]"
                    size="xs"
                    class="w-24"
                    @update:model-value="(val) => updateCollaboratorRole(invite.id, 'PENDING', val as any)"
                  />
                  <UButton 
                    icon="i-lucide-x" 
                    color="neutral" 
                    variant="subtle" 
                    size="xs"
                    @click="removeCollaborator(invite.id, 'PENDING')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="outline" @click="isInvitationModalOpen = false">
            Tutup
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Modal Log Aktivitas -->
    <UModal v-model:open="isAuditLogModalOpen" title="Log Aktivitas Keluarga" description="Daftar aktivitas penambahan, pembaruan, dan penghapusan anggota keluarga.">
      <template #body>
        <div class="space-y-4 pt-2 max-h-96 overflow-y-auto">
          <div v-if="loadingAuditLogs" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-14 w-full" />
          </div>
          
          <div v-else-if="!auditLogsList.length" class="text-center py-8 text-sm text-muted">
            Belum ada aktivitas tercatat.
          </div>
          
          <div v-else class="space-y-3 pr-1">
            <div 
              v-for="log in auditLogsList" 
              :key="log.id" 
              class="flex gap-3 p-3 rounded-lg border border-default bg-elevated/20 text-xs"
            >
              <UAvatar :src="log.user?.image" :alt="log.user?.name" size="xs" class="mt-0.5" />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-highlighted">
                  {{ formatLogMessage(log) }}
                </p>
                <div class="flex items-center gap-1.5 mt-1 text-muted">
                  <span>{{ new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
                  <span v-if="log.user?.email">&bull; {{ log.user.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="outline" @click="isAuditLogModalOpen = false">
            Tutup
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
