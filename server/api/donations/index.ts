import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { donations, siteDonationSettings } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'

const createDonationSchema = z.object({
  paymentMethodId: z.string().uuid(),
  donorName: z.string().min(1).max(150),
  donorEmail: z.string().email().optional().nullable().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  amount: z.coerce.number().positive(),
  transferSenderName: z.string().max(150).optional().nullable(),
  transferNote: z.string().optional().nullable(),
  proofFileUrl: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)

  if (getMethod(event) === 'GET') {
    const [methods, paidDonations] = await Promise.all([
      db
        .select()
        .from(siteDonationSettings)
        .where(eq(siteDonationSettings.isActive, true))
        .orderBy(desc(siteDonationSettings.createdAt)),
      db
        .select({
          id: donations.id,
          donorName: donations.donorName,
          isAnonymous: donations.isAnonymous,
          amount: donations.amount,
          currency: donations.currency,
          paidAt: donations.paidAt,
          createdAt: donations.createdAt
        })
        .from(donations)
        .where(eq(donations.status, 'PAID'))
        .orderBy(desc(donations.paidAt), desc(donations.createdAt))
    ])

    return { methods, donations: paidDonations }
  }

  const body = await readBody(event)
  const result = createDonationSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Input donasi tidak valid.'
    })
  }

  const [method] = await db
    .select({ id: siteDonationSettings.id })
    .from(siteDonationSettings)
    .where(eq(siteDonationSettings.id, result.data.paymentMethodId))
    .limit(1)

  if (!method) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Metode donasi tidak valid.'
    })
  }

  const [donation] = await db.insert(donations).values({
    userId: currentUser.id,
    paymentMethodId: result.data.paymentMethodId,
    donorName: result.data.donorName.trim(),
    donorEmail: result.data.donorEmail || currentUser.email,
    isAnonymous: result.data.isAnonymous,
    amount: result.data.amount.toFixed(2),
    transferSenderName: result.data.transferSenderName || null,
    transferNote: result.data.transferNote || null,
    proofFileUrl: result.data.proofFileUrl,
    status: 'UNDER_REVIEW'
  }).returning()

  return { donation }
})
