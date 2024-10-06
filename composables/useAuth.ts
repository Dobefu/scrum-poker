export function useAuth() {
  const getUser = async () => {
    const { data, error } = await useAsyncData("get-user", () => {
      const { ssrContext } = useNuxtApp()
      const token = ssrContext?.event.context.authToken

      return $fetch("/api/v1/get-user", {
        method: "POST",
        body: {
          token: token,
        },
      })
    })

    if (error.value) return

    return data.value || undefined
  }

  return {
    getUser,
  }
}
