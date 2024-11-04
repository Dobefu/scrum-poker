// @ts-expect-error No types are available for this package.
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
      version: "v1.2.0",
      https: !!process.env.HTTPS,
      wsEndpoint: process.env.WS_ENDPOINT,
    },
  },

  app: {
    rootAttrs: {
      id: "app",
      class: "flex flex-col flex-1",
    },
    head: {
      titleTemplate: "%s | Scrum Poker",
    },
  },

  experimental: {
    componentIslands: true,
  },

  modules: [
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "nuxt-security",
    "@nuxtjs/seo",
    "@nuxt/icon",
    "@nuxt/image",
    "@formkit/auto-animate",
  ],

  tailwindcss: {
    config: {
      content: ["nuxt.config.ts", "components"],
      theme: {
        colors: {
          primary: colors.blue,

          info: colors.sky,
          success: colors.green,
          warning: colors.amber,
          danger: colors.rose,

          gray: colors.zinc,

          black: colors.black,
          slate: colors.slate,
          neutral: colors.neutral,
          zinc: colors.zinc,
          white: colors.white,
          green: colors.green,
          yellow: colors.yellow,
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
          "'nonce-{{nonce}}'",
        ],
      },
    },
  },
})
