import { eq } from 'drizzle-orm'
import { siteDonationSettings } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Site donation setting id is required.'
    })
  }

  await db.delete(siteDonationSettings).where(eq(siteDonationSettings.id, id))

  return { success: true }
})
