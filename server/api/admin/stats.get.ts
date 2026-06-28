import { and, isNull, sql, desc, eq } from 'drizzle-orm'
import { user, families, familyMembers, mediaFiles } from '../../database/schema'
import { db } from '../../utils/db'
import { requireAdminUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  // 1. Count totals
  const [usersCountRes] = await db.select({ count: sql<number>`count(*)` }).from(user)
  const [familiesCountRes] = await db.select({ count: sql<number>`count(*)` }).from(families).where(isNull(families.deletedAt))
  const [membersCountRes] = await db.select({ count: sql<number>`count(*)` }).from(familyMembers).where(isNull(familyMembers.deletedAt))
  const [mediaCountRes] = await db.select({ count: sql<number>`count(*)` }).from(mediaFiles)

  // 2. Get 5 newest users
  const recentUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(5)

  // 3. Get 5 newest families
  const recentFamilies = await db
    .select({
      id: families.id,
      name: families.name,
      slug: families.slug,
      createdAt: families.createdAt,
      ownerName: user.name,
      ownerEmail: user.email
    })
    .from(families)
    .leftJoin(user, eq(families.ownerUserId, user.id))
    .where(isNull(families.deletedAt))
    .orderBy(desc(families.createdAt))
    .limit(5)

  return {
    stats: {
      usersCount: Number(usersCountRes?.count || 0),
      familiesCount: Number(familiesCountRes?.count || 0),
      membersCount: Number(membersCountRes?.count || 0),
      mediaCount: Number(mediaCountRes?.count || 0)
    },
    recentUsers,
    recentFamilies
  }
})
