import { z } from 'zod'
import { permissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)
  const result = createPermissionSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Input tidak valid.'
    })
  }

  const [newPermission] = await db.insert(permissions).values({
    name: result.data.name.toLowerCase(),
    description: result.data.description || null
  }).returning()

  return { permission: newPermission }
})
