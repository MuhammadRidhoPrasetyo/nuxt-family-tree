import { z } from 'zod'
import { roles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireAdminUser } from '../../../utils/session'

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = await readBody(event)
  const result = createRoleSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Input tidak valid.'
    })
  }

  const [newRole] = await db.insert(roles).values({
    name: result.data.name.toUpperCase(),
    description: result.data.description || null
  }).returning()

  return { role: newRole }
})
