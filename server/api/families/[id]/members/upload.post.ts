import { requireCurrentUser } from '../../../../utils/session'
import { promises as fs } from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')

  if (!familyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID Keluarga tidak valid.'
    })
  }

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
      message: 'File tidak ditemukan.'
    })
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedMimeTypes.includes(file.type || '')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP.'
    })
  }

  const uploadDir = path.join(process.cwd(), 'app', 'public', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })

  const fileExt = path.extname(file.filename) || '.jpg'
  const newFilename = `${crypto.randomUUID()}${fileExt}`
  const filePath = path.join(uploadDir, newFilename)

  await fs.writeFile(filePath, file.data)

  return {
    url: `/uploads/${newFilename}`
  }
})
