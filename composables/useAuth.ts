import { useSSRContext } from "vue"

export function useAuth() {
  const getUser = async () => {
    const { data, error } = await useAsyncData("get-user", () => {
      const context = useSSRContext()
      const token = context?.event.context.authToken

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
