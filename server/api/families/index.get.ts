import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { families } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'

const FamilySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  visibility: z.enum(['PRIVATE', 'INVITE_ONLY', 'PUBLIC']),
  createdAt: z.date(),
  updatedAt: z.date()
})

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)

  const rows = await db
    .select({
      id: families.id,
      name: families.name,
      slug: families.slug,
      description: families.description,
      visibility: families.visibility,
      createdAt: families.createdAt,
      updatedAt: families.updatedAt
    })
    .from(families)
    .where(and(
      eq(families.ownerUserId, user.id),
      isNull(families.deletedAt)
    ))
    .orderBy(desc(families.updatedAt))

  return {
    families: z.array(FamilySchema).parse(rows)
  }
})
