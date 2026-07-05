import { createReadStream, promises as fs } from 'fs'
import path from 'path'

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}

export default defineEventHandler(async (event) => {
  const requestPath = event.path.split('?')[0]

  if (!requestPath.startsWith('/uploads/')) {
    return
  }

  const filename = decodeURIComponent(requestPath.replace('/uploads/', ''))
  const uploadDirs = [
    path.resolve(process.cwd(), 'app', 'public', 'uploads'),
    path.resolve(process.cwd(), 'public', 'uploads')
  ]

  for (const uploadDir of uploadDirs) {
    const filePath = path.resolve(uploadDir, filename)

    if (!filePath.startsWith(`${uploadDir}${path.sep}`)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Path file tidak valid.'
      })
    }

    try {
      const stat = await fs.stat(filePath)
      if (!stat.isFile()) continue

      const ext = path.extname(filePath).toLowerCase()
      setHeader(event, 'content-type', contentTypes[ext] || 'application/octet-stream')
      setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
      return sendStream(event, createReadStream(filePath))
    } catch {
      // Try the next upload directory.
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found'
  })
})
