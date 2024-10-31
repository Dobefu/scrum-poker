export function useAuth() {
  const getUser = async (): Promise<User | undefined> => {
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
    if (!data.value) return

    return {
      ...data.value,
      createdAt: new Date(Date.parse(data.value.createdAt)),
      lastActive: new Date(Date.parse(data.value.lastActive)),
    } satisfies User
  }

  return {
    getUser,
  }
}
