export default defineNuxtConfig({
  compatibilityDate: '2026-06-27',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    public: {
      betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    }
  },
  typescript: {
    typeCheck: true
  }
})
