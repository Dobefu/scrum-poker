import type { UserDataUser } from "~/types/user-data"

export function useAuth() {
  const getUser = async (): Promise<UserDataUser["User"] | undefined> => {
    const { data, error } = await useAsyncData<string>("get-user", () => {
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
      CreatedAt: new Date(JSON.parse(data.value).CreatedAt),
      LastActive: new Date(JSON.parse(data.value).LastActive),
    } satisfies UserDataUser["User"]
  }

  return {
    getUser,
  }
}
