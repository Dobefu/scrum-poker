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

  modules: [
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "nuxt-security",
    "@nuxtjs/seo",
    "@nuxt/icon",
  ],
})
