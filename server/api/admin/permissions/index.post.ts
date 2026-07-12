import { z } from 'zod'
import { permissions } from '../../../database/schema'
import { db } from '../../../utils/db'
import { ok, parseWithZod } from '../../../utils/api'
import { requireAdminUser } from '../../../utils/session'

const createPermissionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional()
})

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)
  const body = parseWithZod(createPermissionSchema, await readBody(event))

  const [newPermission] = await db.insert(permissions).values({
    name: body.name.toLowerCase(),
    description: body.description || null
  }).returning()

  return ok({ permission: newPermission })
})
