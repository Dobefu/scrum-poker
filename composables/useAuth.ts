export function useAuth() {
  const token = useCookie("auth-token")

  const getUser = async () => {
    if (!token) return

    const { data, error } = await useAsyncData("get-user", () =>
      $fetch("/api/v1/get-user", {
        method: "POST",
        body: {
          token: token.value,
        },
      }),
    )

    if (error.value) return

    return data.value || undefined
  }

  return {
    getUser,
  }
}
