export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.client) return

  const token = useCookie("auth-token", {
    httpOnly: true,
    expires: new Date(Date.now() + 864e5),
    path: "/",
    sameSite: "lax",
  })

  const result = await $fetch("/api/v1/refresh-token", {
    method: "POST",
    body: {
      token: token.value,
    },
  })

  if (!result?.success) return

  token.value = result.token
})
