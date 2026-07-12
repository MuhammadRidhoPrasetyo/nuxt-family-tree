import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import { roles, userRoles } from '../database/schema'
import { eq } from 'drizzle-orm'

const config = useRuntimeConfig()
const configuredAuthOrigin = config.public.betterAuthUrl.replace(/\/$/, '')
const envTrustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ?.split(',')
  .map(origin => origin.trim())
  .filter(Boolean) || []

export const auth = betterAuth({
  secret: config.betterAuthSecret,
  baseURL: configuredAuthOrigin,
  trustedOrigins: [
    configuredAuthOrigin,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    ...envTrustedOrigins
  ],
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),
  socialProviders: config.googleClientId && config.googleClientSecret
    ? {
        google: {
          clientId: config.googleClientId,
          clientSecret: config.googleClientSecret
        }
      }
    : undefined,
  emailAndPassword: {
    enabled: true
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`Verification email for ${user.email}: ${url}`)
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          let role = await db.query.roles.findFirst({
            where: eq(roles.name, 'USER')
          })
          if (!role) {
            const [newRole] = await db.insert(roles).values({
              name: 'USER',
              description: 'Default user role'
            }).returning()
            if (!newRole) {
              throw new Error('Failed to create default role')
            }
            role = newRole
          }
          if (role) {
            await db.insert(userRoles).values({
              userId: user.id,
              roleId: role.id
            })
          }
        }
      }
    }
  }
})
