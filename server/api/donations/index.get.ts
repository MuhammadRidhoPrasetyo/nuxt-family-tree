import { desc, eq } from 'drizzle-orm'
import { donations, siteDonationSettings } from '../../database/schema'
import { db } from '../../utils/db'
import { requireCurrentUser } from '../../utils/session'
import { ok } from '../../utils/api'

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event)

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

  return ok({
    methods,
    donations: paidDonations
  })
})

