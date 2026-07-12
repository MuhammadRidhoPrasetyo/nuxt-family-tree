import { eq, and, isNull } from 'drizzle-orm'
import {
  families,
  familyMembers,
  familyTreeNodePreferences,
  familyTreePreferences,
  familyUserRoles,
  marriages,
  parentChildRelations,
  privacySettings
} from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

type NodeViewMode = 'CLASSIC_CARD' | 'COMPACT_MINIMAL' | 'DETAILED_PROFILE' | 'MEMORIAL_STYLE'

type TreePreferencesResponse = {
  id?: string
  familyId?: string
  userId?: string
  nodeViewMode: NodeViewMode
  showPhotos: boolean
  showBirthDates: boolean
  showNicknames: boolean
  colorByGender: boolean
  createdAt?: Date
  updatedAt?: Date
}

const defaultTreePreferences: TreePreferencesResponse = {
  nodeViewMode: 'CLASSIC_CARD',
  showPhotos: true,
  showBirthDates: true,
  showNicknames: true,
  colorByGender: true
}

const isMissingPreferenceSchemaError = (error: unknown) => {
  const candidate = error as { code?: string, cause?: { code?: string }, message?: string }
  return (
    candidate?.code === '42P01' ||
    candidate?.cause?.code === '42P01' ||
    candidate?.message?.includes('family_tree_preferences') ||
    candidate?.message?.includes('family_tree_node_preferences') ||
    candidate?.message?.includes('node_view_mode')
  )
}

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Family ID tidak valid.'
    })
  }

  const [family] = await db
    .select({
      id: families.id,
      ownerUserId: families.ownerUserId
    })
    .from(families)
    .where(and(
      eq(families.id, familyId),
      isNull(families.deletedAt)
    ))
    .limit(1)

  if (!family) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Family tree tidak ditemukan.'
    })
  }

  // Check user permissions in familyUserRoles, but always allow the owner.
  let [userRole] = await db
    .select()
    .from(familyUserRoles)
    .where(and(
      eq(familyUserRoles.familyId, familyId),
      eq(familyUserRoles.userId, user.id)
    ))
    .limit(1)

  if (!userRole && family.ownerUserId === user.id) {
    await db
      .insert(familyUserRoles)
      .values({
        familyId,
        userId: user.id,
        role: 'OWNER'
      })
      .onConflictDoNothing()

    const [ownerRole] = await db
      .select()
      .from(familyUserRoles)
      .where(and(
        eq(familyUserRoles.familyId, familyId),
        eq(familyUserRoles.userId, user.id)
      ))
      .limit(1)

    userRole = ownerRole || {
      id: '',
      familyId,
      userId: user.id,
      role: 'OWNER' as const,
      createdAt: new Date()
    }
  }

  if (!userRole) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses ke keluarga ini.'
    })
  }

  // Fetch privacy settings
  const existingSettings = await db
    .select()
    .from(privacySettings)
    .where(eq(privacySettings.familyId, familyId))
    .limit(1)

  let privacy = existingSettings[0]

  if (!privacy) {
    await db
      .insert(privacySettings)
      .values({ familyId })
      .onConflictDoNothing()

    const [newSettings] = await db
      .select()
      .from(privacySettings)
      .where(eq(privacySettings.familyId, familyId))
      .limit(1)

    privacy = newSettings
  }

  if (!privacy) {
    throw createError({
      statusCode: 500,
      message: 'Gagal memuat pengaturan privasi.'
    })
  }

  let preferences: TreePreferencesResponse = defaultTreePreferences
  let nodePreferences: any[] = []

  try {
    let [storedPreferences] = await db
      .select()
      .from(familyTreePreferences)
      .where(and(
        eq(familyTreePreferences.familyId, familyId),
        eq(familyTreePreferences.userId, user.id)
      ))
      .limit(1)

    if (!storedPreferences) {
      await db
        .insert(familyTreePreferences)
        .values({ familyId, userId: user.id })
        .onConflictDoNothing()

      const [createdPreferences] = await db
        .select()
        .from(familyTreePreferences)
        .where(and(
          eq(familyTreePreferences.familyId, familyId),
          eq(familyTreePreferences.userId, user.id)
        ))
        .limit(1)

      storedPreferences = createdPreferences
    }

    preferences = storedPreferences || defaultTreePreferences
  } catch (error) {
    if (!isMissingPreferenceSchemaError(error)) {
      throw error
    }
  }

  let members = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, familyId),
        isNull(familyMembers.deletedAt)
      )
    )

  // Enforce privacy settings for VIEWER role
  if (userRole.role === 'VIEWER') {
    if (!privacy.showLivingPeople) {
      members = members.filter(m => !m.isAlive)
    }
    members = members.map(m => {
      const masked = { ...m }
      if (!privacy.showBirthDate) {
        masked.birthDate = null
        masked.birthPlace = null
      }
      if (!privacy.showDeathDate) {
        masked.deathDate = null
        masked.deathPlace = null
      }
      if (!privacy.showContact) {
        masked.email = null
        masked.phone = null
        masked.address = null
      }
      // Always hide private notes from viewers
      masked.notesPrivate = null
      return masked
    })
  }

  const visibleMemberIds = new Set(members.map(m => m.id))

  const relations = (await db
    .select()
    .from(parentChildRelations)
    .where(eq(parentChildRelations.familyId, familyId)))
    .filter(r => visibleMemberIds.has(r.parentId) && visibleMemberIds.has(r.childId))

  const marriageList = (await db
    .select()
    .from(marriages)
    .where(eq(marriages.familyId, familyId)))
    .filter(m => visibleMemberIds.has(m.partner1Id) && visibleMemberIds.has(m.partner2Id))

  try {
    nodePreferences = (await db
      .select()
      .from(familyTreeNodePreferences)
      .where(and(
        eq(familyTreeNodePreferences.familyId, familyId),
        eq(familyTreeNodePreferences.userId, user.id)
      )))
      .filter(preference => visibleMemberIds.has(preference.memberId))
  } catch (error) {
    if (!isMissingPreferenceSchemaError(error)) {
      throw error
    }
  }

  return {
    members,
    relations,
    marriages: marriageList,
    preferences,
    nodePreferences
  }
})
