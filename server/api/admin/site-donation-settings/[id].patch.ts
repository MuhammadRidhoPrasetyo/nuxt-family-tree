import { eq } from 'drizzle-orm'
import { siteDonationSettings } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'
import { ok, parseUuidParam, parseWithZod } from '../../../utils/api'
import { normalizeSiteDonationSettingPayload, siteDonationSettingSchema } from '../../../utils/siteDonationSettings'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const id = parseUuidParam(getRouterParam(event, 'id'), 'Site donation setting ID')

  const body = parseWithZod(siteDonationSettingSchema, normalizeSiteDonationSettingPayload(await readBody(event)))

  const [setting] = await db
    .update(siteDonationSettings)
    .set({
      type: body.type,
      providerName: body.providerName || null,
      accountName: body.accountName || null,
      accountNumber: body.accountNumber || null,
      qrImageUrl: body.qrImageUrl || null,
      instructions: body.instructions || null,
      isActive: body.isActive,
      updatedAt: new Date()
    })
    .where(eq(siteDonationSettings.id, id))
    .returning()

  return ok({ setting })
})
