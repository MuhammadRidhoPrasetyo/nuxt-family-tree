import { eq } from 'drizzle-orm'
import { siteDonationSettings } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok, parseUuidParam } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = parseUuidParam(getRouterParam(event, 'id'), 'Site donation setting ID')

  await db.delete(siteDonationSettings).where(eq(siteDonationSettings.id, id))

  return ok({ success: true })
})
