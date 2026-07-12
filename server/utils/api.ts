import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { families, familyMembers, familyUserRoles } from '../database/schema'
import { db } from './db'

type FamilyRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'

export const uuidSchema = z.string().uuid()

export function ok<T extends Record<string, unknown>>(payload: T, meta?: Record<string, unknown>) {
  return {
    ...payload,
    data: payload,
    ...(meta ? { meta } : {})
  }
}

export function validationError(error?: z.ZodError): never {
  throw createError({
    statusCode: 422,
    statusMessage: 'Validation Error',
    message: 'Validation failed',
    data: error
      ? {
          errors: z.treeifyError(error)
        }
      : undefined
  })
}

export function parseUuidParam(value: string | undefined, label: string) {
  const result = uuidSchema.safeParse(value)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `${label} tidak valid.`
    })
  }
  return result.data
}

export function parseWithZod<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    validationError(result.error)
  }
  return result.data
}

export async function requireFamilyRole(
  familyId: string,
  userId: string,
  allowedRoles: FamilyRole[]
) {
  const [family] = await db
    .select({
      id: families.id,
      ownerUserId: families.ownerUserId
    })
    .from(families)
    .where(and(
      eq(families.id, familyId),
      isNull(families.deletedAt)
    ))
    .limit(1)

  if (!family) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Family tree tidak ditemukan.'
    })
  }

  const [storedRole] = await db
    .select()
    .from(familyUserRoles)
    .where(and(
      eq(familyUserRoles.familyId, familyId),
      eq(familyUserRoles.userId, userId)
    ))
    .limit(1)

  const role = storedRole?.role || (family.ownerUserId === userId ? 'OWNER' : null)

  if (!role || !allowedRoles.includes(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Anda tidak memiliki akses untuk resource ini.'
    })
  }

  return {
    family,
    role
  }
}

export async function assertMembersBelongToFamily(familyId: string, memberIds: string[]) {
  const uniqueMemberIds = [...new Set(memberIds)]

  if (!uniqueMemberIds.length) {
    return
  }

  const rows = await Promise.all(uniqueMemberIds.map(memberId => db
    .select({ id: familyMembers.id })
    .from(familyMembers)
    .where(and(
      eq(familyMembers.id, memberId),
      eq(familyMembers.familyId, familyId),
      isNull(familyMembers.deletedAt)
    ))
    .limit(1)))

  if (rows.some(row => !row[0])) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Anggota keluarga pada relasi tidak valid.'
    })
  }
}
