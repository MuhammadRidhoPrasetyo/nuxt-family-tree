import { hashPassword } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../server/database/schema'
import { account, families, familyUserRoles, user, roles, userRoles } from '../server/database/schema'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing. Copy .env.example to .env before running the seeder.')
}

const seedAdmin = {
  id: 'seed-admin-user',
  name: 'Admin Family Tree',
  email: 'admin@example.com',
  password: 'password123',
  role: 'ADMIN' as const
}

const seedUser = {
  id: 'seed-regular-user',
  name: 'User Family Tree',
  email: 'user@example.com',
  password: 'password123',
  role: 'USER' as const
}

const seedFamily = {
  name: 'Keluarga Demo',
  slug: 'keluarga-demo',
  description: 'Family tree demo untuk pengujian awal.',
  visibility: 'PRIVATE' as const
}

const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle(pool, { schema })

async function main() {
  const now = new Date()

  // 1. Seed Roles (ADMIN and USER)
  console.info('Seeding roles...')
  let adminRole = await db.query.roles.findFirst({ where: eq(roles.name, 'ADMIN') })
  if (!adminRole) {
    const [newRole] = await db.insert(roles).values({
      name: 'ADMIN',
      description: 'Administrator role with full RBAC control'
    }).returning()
    adminRole = newRole
  }

  let userRole = await db.query.roles.findFirst({ where: eq(roles.name, 'USER') })
  if (!userRole) {
    const [newRole] = await db.insert(roles).values({
      name: 'USER',
      description: 'Default regular user role'
    }).returning()
    userRole = newRole
  }

  // Helper function to seed a user
  const seedUserRecord = async (seedData: typeof seedAdmin, targetRoleId: string) => {
    console.info(`Seeding user: ${seedData.email}...`)
    const passwordHash = await hashPassword(seedData.password)

    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, seedData.email))
      .limit(1)

    const userId = existingUser?.id || seedData.id

    if (existingUser) {
      await db
        .update(user)
        .set({
          name: seedData.name,
          emailVerified: true,
          role: seedData.role,
          status: 'ACTIVE',
          updatedAt: now
        })
        .where(eq(user.id, userId))
    } else {
      await db.insert(user).values({
        id: userId,
        name: seedData.name,
        email: seedData.email,
        emailVerified: true,
        role: seedData.role,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      })
    }

    // Seed credentials account
    const [credentialAccount] = await db
      .select()
      .from(account)
      .where(and(
        eq(account.userId, userId),
        eq(account.providerId, 'credential')
      ))
      .limit(1)

    if (credentialAccount) {
      await db
        .update(account)
        .set({
          accountId: userId,
          password: passwordHash,
          updatedAt: now
        })
        .where(eq(account.id, credentialAccount.id))
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now
      })
    }

    // Seed user role mapping
    const [existingUserRole] = await db
      .select()
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.roleId, targetRoleId)
      ))
      .limit(1)

    if (!existingUserRole) {
      // Clear previous roles first (assuming 1 main role for simplicity)
      await db.delete(userRoles).where(eq(userRoles.userId, userId))
      await db.insert(userRoles).values({
        userId,
        roleId: targetRoleId
      })
    }

    return userId
  }

  // Seed both users
  if (adminRole && userRole) {
    const adminUserId = await seedUserRecord(seedAdmin, adminRole.id)
    const regularUserId = await seedUserRecord(seedUser, userRole.id)

    // Seed Family Tree owned by Admin
    console.info('Seeding family tree...')
    const [existingFamily] = await db
      .select()
      .from(families)
      .where(eq(families.slug, seedFamily.slug))
      .limit(1)

    const family = existingFamily ?? (await db
      .insert(families)
      .values({
        ownerUserId: adminUserId,
        name: seedFamily.name,
        slug: seedFamily.slug,
        description: seedFamily.description,
        visibility: seedFamily.visibility,
        createdAt: now,
        updatedAt: now
      })
      .returning())[0]

    const [existingRole] = await db
      .select()
      .from(familyUserRoles)
      .where(and(
        eq(familyUserRoles.familyId, family.id),
        eq(familyUserRoles.userId, adminUserId)
      ))
      .limit(1)

    if (!existingRole) {
      await db.insert(familyUserRoles).values({
        familyId: family.id,
        userId: adminUserId,
        role: 'OWNER',
        createdAt: now
      })
    }
  }

  console.info('Seeder selesai.')
  console.info(`1. Admin Login  ➜ Email: ${seedAdmin.email} | Password: ${seedAdmin.password}`)
  console.info(`2. Regular User ➜ Email: ${seedUser.email} | Password: ${seedUser.password}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
