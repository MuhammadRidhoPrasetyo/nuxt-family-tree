import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { z } from 'zod'
import { families, familyUserRoles } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'

const FamilySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  visibility: z.enum(['PRIVATE', 'INVITE_ONLY', 'PUBLIC']),
  createdAt: z.date(),
  updatedAt: z.date(),
  isShared: z.boolean()
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
      updatedAt: families.updatedAt,
      ownerUserId: families.ownerUserId
    })
    .from(families)
    .leftJoin(familyUserRoles, eq(families.id, familyUserRoles.familyId))
    .where(and(
      or(
        eq(families.ownerUserId, user.id),
        eq(familyUserRoles.userId, user.id)
      ),
      isNull(families.deletedAt)
    ))
    .orderBy(desc(families.updatedAt))

  // De-duplicate rows (since left join can return duplicate family entries if roles map multiple times, though UNIQUE constraint avoids this mostly)
  const uniqueFamiliesMap = new Map<string, any>()
  for (const row of rows) {
    if (!uniqueFamiliesMap.has(row.id)) {
      uniqueFamiliesMap.set(row.id, {
        ...row,
        isShared: row.ownerUserId !== user.id
      })
    }
  }
  const familiesList = Array.from(uniqueFamiliesMap.values())

  return {
    families: z.array(FamilySchema).parse(familiesList)
  }
})
