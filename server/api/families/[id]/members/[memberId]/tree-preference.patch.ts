import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { familyMembers, familyTreeNodePreferences, familyUserRoles } from '../../../../../database/schema'
import { db } from '../../../../../utils/db'
import { requireCurrentUser } from '../../../../../utils/session'

const UpdateNodePreferenceSchema = z.object({
  nodeViewMode: z.enum(['CLASSIC_CARD', 'COMPACT_MINIMAL', 'DETAILED_PROFILE', 'MEMORIAL_STYLE']).nullable().optional(),
  showPhotos: z.boolean().nullable().optional(),
  showBirthDates: z.boolean().nullable().optional(),
  showNicknames: z.boolean().nullable().optional(),
  colorByGender: z.boolean().nullable().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!familyId || !memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID tidak valid.'
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

  const [member] = await db
    .select({ id: familyMembers.id })
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.id, memberId),
        eq(familyMembers.familyId, familyId)
      )
    )
    .limit(1)

  if (!member) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Anggota keluarga tidak ditemukan.'
    })
  }

  const body = await readValidatedBody(event, (data) => UpdateNodePreferenceSchema.parse(data))
  const preferenceValues = {
    nodeViewMode: body.nodeViewMode ?? null,
    showPhotos: body.showPhotos ?? null,
    showBirthDates: body.showBirthDates ?? null,
    showNicknames: body.showNicknames ?? null,
    colorByGender: body.colorByGender ?? null,
    updatedAt: new Date()
  }

  const [preference] = await db
    .insert(familyTreeNodePreferences)
    .values({
      familyId,
      userId: user.id,
      memberId,
      ...preferenceValues
    })
    .onConflictDoUpdate({
      target: [
        familyTreeNodePreferences.familyId,
        familyTreeNodePreferences.userId,
        familyTreeNodePreferences.memberId
      ],
      set: preferenceValues
    })
    .returning()

  return { preference }
})
