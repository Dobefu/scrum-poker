export function useAuth() {
  const getUser = async (): Promise<User | undefined> => {
    const { data, error } = await useAsyncData("get-user", () => {
      const { ssrContext } = useNuxtApp()
      const token = ssrContext?.event.context.authToken

      const config = useRuntimeConfig()

      let proto = "http"
      if (config.public.https) proto = "https"

      return $fetch(`${proto}://${config.public.backendEndpoint}/get-user`, {
        method: "POST",
        body: {
          token,
        },
      })
    })

    if (error.value) return
    if (!data.value) return

    return {
      ...JSON.parse(data.value),
      CreatedAt: new Date(data.value.CreatedAt),
      LastActive: new Date(data.value.LastActive),
    } satisfies User
  }

  return {
    getUser,
  }
}
