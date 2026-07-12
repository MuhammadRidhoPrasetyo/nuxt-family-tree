import { desc } from 'drizzle-orm'
import { siteDonationSettings } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const settings = await db
    .select()
    .from(siteDonationSettings)
    .orderBy(desc(siteDonationSettings.createdAt))

  return ok({ settings })
})

