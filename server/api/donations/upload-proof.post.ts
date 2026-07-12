import { promises as fs } from 'fs'
import path from 'path'
import { requireCurrentUser } from '../../utils/session'

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

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedMimeTypes.includes(file.type || '')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.'
    })
  }

  const maxSize = 5 * 1024 * 1024
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Ukuran file maksimal 5MB.'
    })
  }

  const uploadDir = path.join(process.cwd(), 'app', 'public', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })

  const fileExt = path.extname(file.filename) || '.jpg'
  const newFilename = `donation-proof-${crypto.randomUUID()}${fileExt}`
  const filePath = path.join(uploadDir, newFilename)

  await fs.writeFile(filePath, file.data)

  return {
    url: `/uploads/${newFilename}`
  }
})
