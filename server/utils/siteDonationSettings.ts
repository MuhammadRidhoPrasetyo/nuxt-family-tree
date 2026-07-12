import { z } from 'zod'

export const siteDonationSettingSchema = z.object({
  type: z.enum(['BANK_TRANSFER', 'QRIS']),
  providerName: z.string().trim().max(100).optional().nullable(),
  accountName: z.string().trim().max(150).optional().nullable(),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  qrImageUrl: z.string().trim().url().optional().nullable().or(z.literal('')),
  instructions: z.string().trim().max(2000).optional().nullable(),
  isActive: z.boolean().default(true)
})

export const normalizeSiteDonationSettingPayload = (body: unknown) => {
  const candidate = body && typeof body === 'object' ? body as Record<string, unknown> : {}

  return {
    type: typeof candidate.type === 'string'
      ? candidate.type
      : candidate.type && typeof candidate.type === 'object' && 'value' in candidate.type
        ? (candidate.type as { value?: unknown }).value
        : undefined,
    providerName: typeof candidate.providerName === 'string' ? candidate.providerName : null,
    accountName: typeof candidate.accountName === 'string' ? candidate.accountName : null,
    accountNumber: typeof candidate.accountNumber === 'string' ? candidate.accountNumber : null,
    qrImageUrl: typeof candidate.qrImageUrl === 'string' ? candidate.qrImageUrl : null,
    instructions: typeof candidate.instructions === 'string' ? candidate.instructions : null,
    isActive: typeof candidate.isActive === 'boolean' ? candidate.isActive : Boolean(candidate.isActive)
  }
}

