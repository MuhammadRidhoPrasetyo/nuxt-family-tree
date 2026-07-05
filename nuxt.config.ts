export default defineNuxtConfig({
  compatibilityDate: '2026-06-27',
  devtools: {
    enabled: process.env.NODE_ENV !== 'production' && process.env.NUXT_DEVTOOLS !== 'false'
  },
  future: {
    compatibilityVersion: 4
  },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  nitro: {
    rollupConfig: {
      watch: {
        exclude: ['node_modules/**']
      }
    }
  },
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
    typeCheck: process.env.NODE_ENV === 'production'
  }
})
