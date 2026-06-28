import { z } from 'zod'
import { privacySettings, familyUserRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'
import { eq, and } from 'drizzle-orm'

const UpdatePrivacySettingsSchema = z.object({
  showLivingPeople: z.boolean(),
  showBirthDate: z.boolean(),
  showDeathDate: z.boolean(),
  showContact: z.boolean(),
  allowExport: z.boolean(),
  allowGuestView: z.boolean()
})

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

  // Check user permissions: ONLY OWNER can modify privacy settings
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

  if (!userRole || userRole.role !== 'OWNER') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Hanya pemilik (owner) yang dapat mengubah pengaturan privasi.'
    })
  }

  const body = await readValidatedBody(event, (data) => UpdatePrivacySettingsSchema.parse(data))

  // Find or update privacy settings
  const [settings] = await db
    .insert(privacySettings)
    .values({
      familyId,
      showLivingPeople: body.showLivingPeople,
      showBirthDate: body.showBirthDate,
      showDeathDate: body.showDeathDate,
      showContact: body.showContact,
      allowExport: body.allowExport,
      allowGuestView: body.allowGuestView,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: privacySettings.familyId,
      set: {
        showLivingPeople: body.showLivingPeople,
        showBirthDate: body.showBirthDate,
        showDeathDate: body.showDeathDate,
        showContact: body.showContact,
        allowExport: body.allowExport,
        allowGuestView: body.allowGuestView,
        updatedAt: new Date()
      }
    })
    .returning()

  return { privacySettings: settings }
})
