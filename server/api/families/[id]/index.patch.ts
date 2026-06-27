import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { families } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

const UpdateFamilySchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  visibility: z.enum(['PRIVATE', 'INVITE_ONLY', 'PUBLIC'])
})

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Family id is required' })
  }

  const body = await readValidatedBody(event, (data) => UpdateFamilySchema.parse(data))

  const [family] = await db
    .update(families)
    .set({
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      visibility: body.visibility,
      updatedAt: new Date()
    })
    .where(and(
      eq(families.id, id),
      eq(families.ownerUserId, user.id),
      isNull(families.deletedAt)
    ))
    .returning()

  if (!family) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Family not found',
      message: 'Family tree tidak ditemukan.'
    })
  }

  return { family }
})
