import { z } from 'zod'
import { roles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok, parseWithZod } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(500).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = parseWithZod(createRoleSchema, await readBody(event))

  const [newRole] = await db.insert(roles).values({
    name: body.name.toUpperCase(),
    description: body.description || null
  }).returning()

  return ok({ role: newRole })
})
