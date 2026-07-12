import { siteDonationSettings } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok, parseWithZod } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'
import { normalizeSiteDonationSettingPayload, siteDonationSettingSchema } from '../../../utils/siteDonationSettings'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAdminUser(event)
  const body = parseWithZod(siteDonationSettingSchema, normalizeSiteDonationSettingPayload(await readBody(event)))

  const [setting] = await db.insert(siteDonationSettings).values({
    type: body.type,
    providerName: body.providerName || null,
    accountName: body.accountName || null,
    accountNumber: body.accountNumber || null,
    qrImageUrl: body.qrImageUrl || null,
    instructions: body.instructions || null,
    isActive: body.isActive,
    createdBy: currentUser.id
  }).returning()

  return ok({ setting })
})
