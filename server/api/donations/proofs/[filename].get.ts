import { createReadStream, promises as fs } from 'fs'
import path from 'path'
import { eq } from 'drizzle-orm'
import { donations } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf'
}

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event)
  const filename = getRouterParam(event, 'filename')

  if (!filename || filename.includes('/') || filename.includes('\\')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Nama file tidak valid.'
    })
  }

  const proofUrl = `/api/donations/proofs/${filename}`
  const [donation] = await db
    .select({
      id: donations.id,
      userId: donations.userId
    })
    .from(donations)
    .where(eq(donations.proofFileUrl, proofUrl))
    .limit(1)

  if (!donation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found'
    })
  }

  const canView = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || donation.userId === currentUser.id
  if (!canView) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses ke file ini.'
    })
  }

  const uploadDir = path.resolve(process.cwd(), 'storage', 'private', 'donation-proofs')
  const filePath = path.resolve(uploadDir, filename)

  if (!filePath.startsWith(`${uploadDir}${path.sep}`)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Path file tidak valid.'
    })
  }

  const stat = await fs.stat(filePath).catch(() => null)
  if (!stat?.isFile()) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found'
    })
  }

  const ext = path.extname(filePath).toLowerCase()
  setHeader(event, 'content-type', contentTypes[ext] || 'application/octet-stream')
  setHeader(event, 'cache-control', 'private, no-store')
  return sendStream(event, createReadStream(filePath))
})

