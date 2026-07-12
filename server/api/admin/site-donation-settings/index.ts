import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { siteDonationSettings } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

const siteDonationSettingSchema = z.object({
  type: z.enum(['BANK_TRANSFER', 'QRIS']),
  providerName: z.string().max(100).optional().nullable(),
  accountName: z.string().max(150).optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  qrImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
})

const normalizePayload = (body: any) => ({
  type: typeof body?.type === 'string' ? body.type : body?.type?.value,
  providerName: typeof body?.providerName === 'string' ? body.providerName : null,
  accountName: typeof body?.accountName === 'string' ? body.accountName : null,
  accountNumber: typeof body?.accountNumber === 'string' ? body.accountNumber : null,
  qrImageUrl: typeof body?.qrImageUrl === 'string' ? body.qrImageUrl : null,
  instructions: typeof body?.instructions === 'string' ? body.instructions : null,
  isActive: typeof body?.isActive === 'boolean' ? body.isActive : Boolean(body?.isActive)
})

export default defineEventHandler(async (event) => {
  const currentUser = await requireAdminUser(event)

  if (getMethod(event) === 'GET') {
    const settings = await db
      .select()
      .from(siteDonationSettings)
      .orderBy(desc(siteDonationSettings.createdAt))

    return { settings }
  }

  const body = await readBody(event)
  const result = siteDonationSettingSchema.safeParse(normalizePayload(body))

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Input site donation settings tidak valid.'
    })
  }

  const [setting] = await db.insert(siteDonationSettings).values({
    type: result.data.type,
    providerName: result.data.providerName || null,
    accountName: result.data.accountName || null,
    accountNumber: result.data.accountNumber || null,
    qrImageUrl: result.data.qrImageUrl || null,
    instructions: result.data.instructions || null,
    isActive: result.data.isActive,
    createdBy: currentUser.id
  }).returning()

  return { setting }
})
