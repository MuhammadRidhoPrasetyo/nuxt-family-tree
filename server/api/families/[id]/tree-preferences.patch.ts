import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { familyTreePreferences, familyUserRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

const UpdateTreePreferencesSchema = z.object({
  nodeViewMode: z.enum(['CLASSIC_CARD', 'COMPACT_MINIMAL', 'DETAILED_PROFILE', 'MEMORIAL_STYLE']),
  showPhotos: z.boolean(),
  showBirthDates: z.boolean(),
  showNicknames: z.boolean(),
  colorByGender: z.boolean()
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

  if (!roles[0]) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses ke keluarga ini.'
    })
  }

  const body = await readValidatedBody(event, (data) => UpdateTreePreferencesSchema.parse(data))

  const [preferences] = await db
    .insert(familyTreePreferences)
    .values({
      familyId,
      userId: user.id,
      nodeViewMode: body.nodeViewMode,
      showPhotos: body.showPhotos,
      showBirthDates: body.showBirthDates,
      showNicknames: body.showNicknames,
      colorByGender: body.colorByGender,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [familyTreePreferences.familyId, familyTreePreferences.userId],
      set: {
        nodeViewMode: body.nodeViewMode,
        showPhotos: body.showPhotos,
        showBirthDates: body.showBirthDates,
        showNicknames: body.showNicknames,
        colorByGender: body.colorByGender,
        updatedAt: new Date()
      }
    })
    .returning()

  return { preferences }
})
