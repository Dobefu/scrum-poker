export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) return
})
