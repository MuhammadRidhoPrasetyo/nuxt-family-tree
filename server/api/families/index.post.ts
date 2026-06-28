import { z } from 'zod'
import { families, familyUserRoles, privacySettings } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'
import { eq } from 'drizzle-orm'

const CreateFamilySchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  visibility: z.enum(['PRIVATE', 'INVITE_ONLY', 'PUBLIC']).default('PRIVATE')
})

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const body = await readValidatedBody(event, (data) => CreateFamilySchema.parse(data))

  const [family] = await db
    .insert(families)
    .values({
      ownerUserId: user.id,
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      visibility: body.visibility
    })
    .returning()

  if (!family) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create family',
      message: 'Family tree gagal dibuat.'
    })
  }

  await db.insert(familyUserRoles).values({
    familyId: family.id,
    userId: user.id,
    role: 'OWNER'
  })

  await db.insert(privacySettings).values({
    familyId: family.id
  })

  return { family }
})
