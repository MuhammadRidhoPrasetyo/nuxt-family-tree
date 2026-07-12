import { promises as fs } from 'fs'
import path from 'path'
import { requireCurrentUser } from '../../utils/session'
import { ok } from '../../utils/api'
import { validateUploadedFile } from '../../utils/upload'

export default defineEventHandler(async (event) => {
  await requireCurrentUser(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Tidak ada file yang diunggah.'
    })
  }

  const file = formData.find((f) => f.name === 'file')
  if (!file || !file.filename || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'File bukti transfer tidak ditemukan.'
    })
  }

  const validatedFile = validateUploadedFile(file, {
    allowedKinds: ['image', 'pdf'],
    maxSize: 5 * 1024 * 1024
  })

  const uploadDir = path.join(process.cwd(), 'storage', 'private', 'donation-proofs')
  await fs.mkdir(uploadDir, { recursive: true })

  const newFilename = `donation-proof-${crypto.randomUUID()}${validatedFile.extension}`
  const filePath = path.join(uploadDir, newFilename)

  await fs.writeFile(filePath, file.data)

  return ok({
    url: `/api/donations/proofs/${newFilename}`
  })
})
