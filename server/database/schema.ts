import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  date,
  decimal,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'SUPER_ADMIN'])
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'SUSPENDED', 'DELETED'])
export const visibilityEnum = pgEnum('visibility', ['PRIVATE', 'INVITE_ONLY', 'PUBLIC'])
export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'UNKNOWN'])
export const datePrecisionEnum = pgEnum('date_precision', ['FULL', 'YEAR_MONTH', 'YEAR', 'UNKNOWN'])
export const memberRelationEnum = pgEnum('member_relation', ['BIOLOGICAL', 'ADOPTED', 'STEP', 'FOSTER', 'UNKNOWN'])
export const parentRoleEnum = pgEnum('parent_role', ['FATHER', 'MOTHER', 'PARENT', 'GUARDIAN'])
export const marriageStatusEnum = pgEnum('marriage_status', ['MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN'])
export const familyRoleEnum = pgEnum('family_role', ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'])
export const invitationRoleEnum = pgEnum('invitation_role', ['EDITOR', 'VIEWER'])
export const mediaTypeEnum = pgEnum('media_type', ['PHOTO', 'DOCUMENT', 'VIDEO', 'OTHER'])
export const donationStatusEnum = pgEnum('donation_status', ['PENDING', 'PAID', 'FAILED', 'REFUNDED'])

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('USER'),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow()
})

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: text('owner_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull(),
  description: text('description'),
  visibility: visibilityEnum('visibility').notNull().default('PRIVATE'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' })
}, (table) => [
  uniqueIndex('families_slug_idx').on(table.slug),
  index('families_owner_user_id_idx').on(table.ownerUserId),
  index('families_visibility_idx').on(table.visibility)
])

export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  gender: genderEnum('gender').notNull().default('UNKNOWN'),
  birthPlace: varchar('birth_place', { length: 100 }),
  birthDate: date('birth_date', { mode: 'date' }),
  birthDatePrecision: datePrecisionEnum('birth_date_precision').notNull().default('UNKNOWN'),
  isAlive: boolean('is_alive').notNull().default(true),
  deathDate: date('death_date', { mode: 'date' }),
  deathPlace: varchar('death_place', { length: 100 }),
  deathDatePrecision: datePrecisionEnum('death_date_precision').notNull().default('UNKNOWN'),
  occupation: varchar('occupation', { length: 100 }),
  education: varchar('education', { length: 100 }),
  religion: varchar('religion', { length: 50 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 150 }),
  address: text('address'),
  bio: text('bio'),
  notesPrivate: text('notes_private'),
  photoUrl: text('photo_url'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' })
}, (table) => [
  index('family_members_family_id_idx').on(table.familyId),
  index('family_members_full_name_idx').on(table.fullName),
  index('family_members_is_alive_idx').on(table.isAlive),
  index('family_members_birth_date_idx').on(table.birthDate)
])

export const parentChildRelations = pgTable('parent_child_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id')
    .notNull()
    .references(() => familyMembers.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => familyMembers.id, { onDelete: 'cascade' }),
  relationType: memberRelationEnum('relation_type').notNull().default('BIOLOGICAL'),
  parentRole: parentRoleEnum('parent_role').notNull().default('PARENT'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  unique('parent_child_relation_unique').on(table.parentId, table.childId, table.relationType),
  check('parent_child_not_same_check', sql`${table.parentId} <> ${table.childId}`),
  index('parent_child_relations_family_id_idx').on(table.familyId),
  index('parent_child_relations_parent_id_idx').on(table.parentId),
  index('parent_child_relations_child_id_idx').on(table.childId)
])

export const marriages = pgTable('marriages', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  partner1Id: uuid('partner_1_id')
    .notNull()
    .references(() => familyMembers.id, { onDelete: 'cascade' }),
  partner2Id: uuid('partner_2_id')
    .notNull()
    .references(() => familyMembers.id, { onDelete: 'cascade' }),
  marriageDate: date('marriage_date', { mode: 'date' }),
  marriagePlace: varchar('marriage_place', { length: 100 }),
  status: marriageStatusEnum('status').notNull().default('UNKNOWN'),
  endedAt: date('ended_at', { mode: 'date' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  check('marriages_partners_not_same_check', sql`${table.partner1Id} <> ${table.partner2Id}`),
  index('marriages_family_id_idx').on(table.familyId),
  index('marriages_partner_1_id_idx').on(table.partner1Id),
  index('marriages_partner_2_id_idx').on(table.partner2Id)
])

export const familyUserRoles = pgTable('family_user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: familyRoleEnum('role').notNull().default('VIEWER'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  unique('family_user_roles_family_user_unique').on(table.familyId, table.userId)
])

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  role: invitationRoleEnum('role').notNull().default('VIEWER'),
  invitedBy: text('invited_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiredAt: timestamp('expired_at', { mode: 'date' }).notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('invitations_token_idx').on(table.token),
  index('invitations_email_idx').on(table.email),
  index('invitations_family_id_idx').on(table.familyId)
])

export const privacySettings = pgTable('privacy_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  showLivingPeople: boolean('show_living_people').notNull().default(false),
  showBirthDate: boolean('show_birth_date').notNull().default(false),
  showDeathDate: boolean('show_death_date').notNull().default(true),
  showContact: boolean('show_contact').notNull().default(false),
  allowExport: boolean('allow_export').notNull().default(false),
  allowGuestView: boolean('allow_guest_view').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('privacy_settings_family_id_idx').on(table.familyId)
])

export const mediaFiles = pgTable('media_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  familyMemberId: uuid('family_member_id').references(() => familyMembers.id, { onDelete: 'set null' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mediaType: mediaTypeEnum('media_type').notNull().default('OTHER'),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  index('media_files_family_id_idx').on(table.familyId),
  index('media_files_family_member_id_idx').on(table.familyMemberId),
  index('media_files_uploaded_by_idx').on(table.uploadedBy)
])

export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  donorName: varchar('donor_name', { length: 150 }),
  donorEmail: varchar('donor_email', { length: 255 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('IDR'),
  paymentProvider: varchar('payment_provider', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 150 }),
  status: donationStatusEnum('status').notNull().default('PENDING'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  familyId: uuid('family_id').references(() => families.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 255 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
})

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
})

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
})

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  unique('user_roles_user_role_unique').on(table.userId, table.roleId)
])

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
}, (table) => [
  unique('role_permissions_role_permission_unique').on(table.roleId, table.permissionId)
])

