import { z } from 'zod'
import { familyMembers, familyUserRoles } from '../../../../database/schema'
import { db } from '../../../../utils/db'
import { requireCurrentUser } from '../../../../utils/session'
import { eq, and } from 'drizzle-orm'

const UpdateMemberSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  nickname: z.string().trim().max(100).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
  birthPlace: z.string().trim().max(100).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  isAlive: z.boolean().default(true),
  deathPlace: z.string().trim().max(100).optional().or(z.literal('')),
  deathDate: z.string().optional().or(z.literal('')),
  occupation: z.string().trim().max(100).optional().or(z.literal('')),
  education: z.string().trim().max(100).optional().or(z.literal('')),
  religion: z.string().trim().max(50).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().max(150).optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  bio: z.string().trim().optional().or(z.literal('')),
  notesPrivate: z.string().trim().optional().or(z.literal('')),
  photoUrl: z.string().trim().optional().or(z.literal(''))
})

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event)
  const familyId = getRouterParam(event, 'id')
  const memberId = getRouterParam(event, 'memberId')

  if (!familyId || !memberId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'ID tidak valid.'
    })
  }

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
      message: 'Anda tidak memiliki akses untuk mengubah anggota di keluarga ini.'
    })
  }

  const body = await readValidatedBody(event, (data) => UpdateMemberSchema.parse(data))

  const [member] = await db
    .update(familyMembers)
    .set({
      fullName: body.fullName,
      nickname: body.nickname || null,
      gender: body.gender,
      birthPlace: body.birthPlace || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      isAlive: body.isAlive,
      deathPlace: body.isAlive ? null : (body.deathPlace || null),
      deathDate: body.isAlive ? null : (body.deathDate ? new Date(body.deathDate) : null),
      occupation: body.occupation || null,
      education: body.education || null,
      religion: body.religion || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      bio: body.bio || null,
      notesPrivate: body.notesPrivate || null,
      photoUrl: body.photoUrl || null,
      updatedBy: user.id,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(familyMembers.id, memberId),
        eq(familyMembers.familyId, familyId)
      )
    )
    .returning()

  if (!member) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Anggota keluarga tidak ditemukan.'
    })
  }

  return { member }
})
