import colors from "tailwindcss/colors"

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",

  ssr: true,

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    public: {
      siteName: "Scrum Poker",
    },
  },

  app: {
    rootAttrs: {
      id: "app",
      class: "flex flex-col flex-1",
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  modules: [
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "nuxt-security",
    "@nuxtjs/seo",
    "@nuxt/icon",
    "@nuxt/image",
  ],

  tailwindcss: {
    config: {
      content: ["nuxt.config.ts", "components"],
      theme: {
        colors: {
          ...colors,

          primary: colors.blue,

          info: colors.sky,
          success: colors.green,
          warning: colors.amber,
          danger: colors.rose,

          gray: colors.zinc,
        },
      },
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        "script-src": [
          "'self'",
          "https:",
          "https://scrum-poker.connor.nl/cdn-cgi/speculation",
          "'unsafe-inline'",
          "'strict-dynamic'",
          "'nonce-{{nonce}}'",
        ],
      },
    },
  },
})
