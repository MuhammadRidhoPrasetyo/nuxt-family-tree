import { eq } from 'drizzle-orm'
import { promises as fs } from 'fs'
import path from 'path'
import { z } from 'zod'
import { donations, siteDonationSettings } from '../../database/schema'
import { db } from '../../utils/db'
import { ok, parseWithZod } from '../../utils/api'
import { requireCurrentUser } from '../../utils/session'

const createDonationSchema = z.object({
  paymentMethodId: z.string().uuid(),
  donorName: z.string().trim().min(1).max(150),
  donorEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  amount: z.coerce.number().positive().max(9999999999),
  transferSenderName: z.string().trim().max(150).optional().nullable(),
  transferNote: z.string().trim().max(2000).optional().nullable(),
  proofFileUrl: z.string().regex(/^\/api\/donations\/proofs\/donation-proof-[a-f0-9-]+\.(jpg|png|webp|pdf)$/)
})

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)
  const body = parseWithZod(createDonationSchema, await readBody(event))

  const [method] = await db
    .select({ id: siteDonationSettings.id })
    .from(siteDonationSettings)
    .where(eq(siteDonationSettings.id, body.paymentMethodId))
    .limit(1)

  if (!method) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Metode donasi tidak valid.'
    })
  }

  const proofFilename = path.basename(body.proofFileUrl)
  const proofPath = path.resolve(process.cwd(), 'storage', 'private', 'donation-proofs', proofFilename)
  const proofDir = path.resolve(process.cwd(), 'storage', 'private', 'donation-proofs')
  const proofStat = proofPath.startsWith(`${proofDir}${path.sep}`)
    ? await fs.stat(proofPath).catch(() => null)
    : null

  if (!proofStat?.isFile()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'File bukti transfer tidak valid.'
    })
  }

  const [donation] = await db.insert(donations).values({
    userId: currentUser.id,
    paymentMethodId: body.paymentMethodId,
    donorName: body.donorName,
    donorEmail: body.donorEmail || currentUser.email,
    isAnonymous: body.isAnonymous,
    amount: body.amount.toFixed(2),
    transferSenderName: body.transferSenderName || null,
    transferNote: body.transferNote || null,
    proofFileUrl: body.proofFileUrl,
    status: 'UNDER_REVIEW'
  }).returning()

  return ok({ donation })
})
