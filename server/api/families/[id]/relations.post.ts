import { z } from 'zod'
import { parentChildRelations, marriages, familyUserRoles } from '../../../database/schema'
import { db } from '../../../utils/db'
import { requireCurrentUser } from '../../../utils/session'
import { eq, and } from 'drizzle-orm'
import { assertMembersBelongToFamily, ok, parseUuidParam } from '../../../utils/api'

const CreateRelationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PARENT_CHILD'),
    parentId: z.string().uuid(),
    childId: z.string().uuid(),
    relationType: z.enum(['BIOLOGICAL', 'ADOPTED', 'STEP', 'FOSTER', 'UNKNOWN']).default('BIOLOGICAL'),
    parentRole: z.enum(['FATHER', 'MOTHER', 'PARENT', 'GUARDIAN']).default('PARENT')
  }),
  z.object({
    type: z.literal('MARRIAGE'),
    partner1Id: z.string().uuid(),
    partner2Id: z.string().uuid(),
    status: z.enum(['MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN']).default('MARRIED')
  })
])

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = parseUuidParam(getRouterParam(event, 'id'), 'Family ID')

  // Check user permissions in familyUserRoles
  const roles = await db
    .select()
    .from(familyUserRoles)
    .where(
      and(
        eq(familyUserRoles.familyId, familyId),
        eq(familyUserRoles.userId, user.id)
      )
    )
    .limit(1)

  const userRole = roles[0]

  if (!userRole || (userRole.role !== 'OWNER' && userRole.role !== 'ADMIN' && userRole.role !== 'EDITOR')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses untuk memodifikasi hubungan di keluarga ini.'
    })
  }

  const body = await readValidatedBody(event, (data) => CreateRelationSchema.parse(data))

  if (body.type === 'PARENT_CHILD') {
    await assertMembersBelongToFamily(familyId, [body.parentId, body.childId])

    const [relation] = await db
      .insert(parentChildRelations)
      .values({
        familyId,
        parentId: body.parentId,
        childId: body.childId,
        relationType: body.relationType,
        parentRole: body.parentRole
      })
      .returning()
    return ok({ relation })
  } else {
    await assertMembersBelongToFamily(familyId, [body.partner1Id, body.partner2Id])

    const [marriage] = await db
      .insert(marriages)
      .values({
        familyId,
        partner1Id: body.partner1Id,
        partner2Id: body.partner2Id,
        status: body.status
      })
      .returning()
    return ok({ marriage })
  }
})
