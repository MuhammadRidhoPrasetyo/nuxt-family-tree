import path from 'path'

type AllowedFileKind = 'image' | 'pdf'

type FileValidationOptions = {
  allowedKinds: AllowedFileKind[]
  maxSize: number
}

type FileValidationResult = {
  extension: string
  mimeType: string
}

const imageSignatures = [
  { extension: '.jpg', mimeType: 'image/jpeg', matches: (data: Buffer) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  { extension: '.png', mimeType: 'image/png', matches: (data: Buffer) => data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extension: '.gif', mimeType: 'image/gif', matches: (data: Buffer) => data.subarray(0, 6).toString('ascii') === 'GIF87a' || data.subarray(0, 6).toString('ascii') === 'GIF89a' },
  { extension: '.webp', mimeType: 'image/webp', matches: (data: Buffer) => data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP' }
]

const pdfSignature = {
  extension: '.pdf',
  mimeType: 'application/pdf',
  matches: (data: Buffer) => data.subarray(0, 5).toString('ascii') === '%PDF-'
}

export function validateUploadedFile(
  file: { filename?: string, type?: string, data?: Buffer },
  options: FileValidationOptions
): FileValidationResult {
  if (!file.filename || !file.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'File tidak ditemukan.'
    })
  }

  if (file.data.length > options.maxSize) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `Ukuran file maksimal ${Math.floor(options.maxSize / 1024 / 1024)}MB.`
    })
  }

  const signatures = [
    ...(options.allowedKinds.includes('image') ? imageSignatures : []),
    ...(options.allowedKinds.includes('pdf') ? [pdfSignature] : [])
  ]

  const detected = signatures.find(signature => signature.matches(file.data!))
  if (!detected) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Format file tidak didukung atau isi file tidak valid.'
    })
  }

  const requestedExt = path.extname(file.filename).toLowerCase()
  if (requestedExt && requestedExt !== detected.extension && !(detected.extension === '.jpg' && requestedExt === '.jpeg')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Ekstensi file tidak sesuai dengan isi file.'
    })
  }

  if (file.type && file.type !== detected.mimeType && !(detected.mimeType === 'image/jpeg' && file.type === 'image/jpg')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'MIME type file tidak sesuai dengan isi file.'
    })
  }

  return detected
}

