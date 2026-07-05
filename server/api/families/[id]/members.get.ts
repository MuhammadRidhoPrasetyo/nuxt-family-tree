import { eq, and, isNull } from 'drizzle-orm'
import {
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

  // Check user permissions in familyUserRoles
  const roles = await db
    .select()
    .from(familyUserRoles)
    .where(
      and(
        eq(familyUserRoles.familyId, familyId),
        eq(familyUserRoles.userId, user.id)
      )
    )
    .limit(1)

  const userRole = roles[0]

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
    const [newSettings] = await db
      .insert(privacySettings)
      .values({ familyId })
      .returning()
    privacy = newSettings
  }

  if (!privacy) {
    throw createError({
      statusCode: 500,
      message: 'Gagal memuat pengaturan privasi.'
    })
  }

  let [preferences] = await db
    .select()
    .from(familyTreePreferences)
    .where(
      and(
        eq(familyTreePreferences.familyId, familyId),
        eq(familyTreePreferences.userId, user.id)
      )
    )
    .limit(1)

  if (!preferences) {
    [preferences] = await db
      .insert(familyTreePreferences)
      .values({ familyId, userId: user.id })
      .returning()
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

  const nodePreferences = (await db
    .select()
    .from(familyTreeNodePreferences)
    .where(
      and(
        eq(familyTreeNodePreferences.familyId, familyId),
        eq(familyTreeNodePreferences.userId, user.id)
      )
    ))
    .filter(preference => visibleMemberIds.has(preference.memberId))

  return {
    members,
    relations,
    marriages: marriageList,
    preferences,
    nodePreferences
  }
})
