import { requireCurrentUser } from '../../../../utils/session'
import { ok, parseUuidParam, requireFamilyRole } from '../../../../utils/api'
import { validateUploadedFile } from '../../../../utils/upload'
import { promises as fs } from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = parseUuidParam(getRouterParam(event, 'id'), 'ID Keluarga')
  await requireFamilyRole(familyId, user.id, ['OWNER', 'ADMIN', 'EDITOR'])

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

  const validatedFile = validateUploadedFile(file, {
    allowedKinds: ['image'],
    maxSize: 5 * 1024 * 1024
  })

  const uploadDir = path.join(process.cwd(), 'app', 'public', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })

  const newFilename = `${crypto.randomUUID()}${validatedFile.extension}`
  const filePath = path.join(uploadDir, newFilename)

  await fs.writeFile(filePath, file.data)

  return ok({
    url: `/uploads/${newFilename}`
  })
})
