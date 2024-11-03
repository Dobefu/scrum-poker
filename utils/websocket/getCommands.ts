import type { UserData, UserDataUser } from "~/types/user-data"

export const getCommands = (
  userData: { value: UserData },
  wss?: WebSocket,
  user?: User,
) => {
  let pingTimeout: NodeJS.Timeout

  const handlePong = (response: Record<string, unknown>) => {
    if (!("type" in response) || response.type !== "pong") return

    clearTimeout(pingTimeout)

    setTimeout(() => {
      wss?.send(JSON.stringify({ type: "ping" }))

      pingTimeout = setTimeout(() => {
        console.info(
          "No response received after 10 seconds. Closing WebSocket...",
        )
        wss?.close()
      }, 10000)
    }, 10000)
  }

  const handleInit = (response: Record<string, unknown>): boolean => {
    if (
      !("type" in response) ||
      response.type !== "init" ||
      !response.data ||
      !user
    ) {
      return false
    }

    userData.value = reactive(response.data)

    wss?.send(JSON.stringify({ type: "ping" }))

    pingTimeout = setTimeout(() => {
      console.info(
        "No response received after 10 seconds. Closing WebSocket...",
      )
      wss?.close()
    }, 10000)

    return true
  }

  const handleJoin = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "join" ||
      !userData.value?.Users ||
      typeof response.user !== "number" ||
      !response.data
    ) {
      return
    }

    userData.value.Users[response.user] = response.data as UserDataUser
  }

  const handleLeave = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "leave" ||
      !userData.value?.Users ||
      typeof response.data !== "number"
    ) {
      return
    }

    delete userData.value.Users[response.data]
  }

  const handleEstimate = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "estimate" ||
      !userData.value?.Users ||
      typeof response.user !== "number"
    ) {
      return
    }

    if (
      userData.value.Users[response.user].User.ID !== user?.id ||
      !response.data
    ) {
      setTimeout(() => {
        if (
          !userData.value?.Users ||
          typeof response.user !== "number" ||
          typeof response.data !== "string"
        )
          return

        userData.value.Users[response.user].Estimate = response.data
      }, 200)

      if (response.data !== "<HIDDEN>" && typeof response.data === "string") {
        userData.value.Users[response.user].Estimate = response.data
      }
    }
  }

  const handleToggleCardVisibility = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "toggleCardVisibility" ||
      !userData.value.RoomSettings
    ) {
      return
    }

    userData.value.RoomSettings.ShowCards =
      !userData.value.RoomSettings.ShowCards
  }

  const handleSetRoomName = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "setRoomName" ||
      !userData.value.RoomSettings ||
      typeof response.data !== "string"
    ) {
      return
    }

    userData.value.RoomSettings.Name = response.data
  }

  const handleSetCards = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "setCards" ||
      !userData.value.RoomSettings ||
      typeof response.data !== "string" ||
      !user
    ) {
      return
    }

    userData.value.RoomSettings.Cards = response.data

    if (!userData.value.Users) return

    const cardsArray = response.data.split(",")

    if (!cardsArray.includes(userData.value.Users[user.id].Estimate))
      userData.value.Users[user.id].Estimate = ""
  }

  const handleSetAllowDelete = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "setAllowDelete" ||
      !userData.value.RoomSettings ||
      typeof response.data !== "boolean" ||
      !("AllowDelete" in userData.value.RoomSettings)
    ) {
      return
    }

    userData.value.RoomSettings.AllowDelete = response.data
  }

  const handleSetAllowShow = (response: Record<string, unknown>) => {
    if (
      !("type" in response) ||
      response.type !== "setAllowShow" ||
      !userData.value.RoomSettings ||
      typeof response.data !== "boolean" ||
      !("AllowShow" in userData.value.RoomSettings)
    ) {
      return
    }

    userData.value.RoomSettings.AllowShow = response.data
  }

  return {
    handlePong,
    handleInit,
    handleJoin,
    handleLeave,
    handleEstimate,
    handleToggleCardVisibility,
    handleSetRoomName,
    handleSetCards,
    handleSetAllowShow,
    handleSetAllowDelete,
  }
}
