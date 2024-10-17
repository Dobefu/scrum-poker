import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"
import { UserData } from "~/types/user-data"

const estimateRedactedString = "<HIDDEN>"

const currentUserData: Record<string, UserData | undefined> = {}
const userData: Record<string, UserData | undefined> = {}
const { db } = useDatabase()
let roomSettings: Record<string, (typeof rooms)["$inferSelect"]> | undefined

export default defineWebSocketHandler({
  async open(peer) {
    let pathParts

    if (process.env.NODE_ENV === "production") {
      // @ts-expect-error Production has a different object.
      pathParts = peer.ctx.node.req.url.split("/")
    } else pathParts = new URL(peer.request?.url!).pathname.split("/")

    const roomUuid = pathParts[pathParts.length - 1]

    if (!roomSettings) roomSettings = {}

    roomSettings[roomUuid] = (
      await db.select().from(rooms).where(eq(rooms.uuid, roomUuid))
    )[0]

    peer.subscribe(`poker_${roomUuid}`)
  },
  async message(peer, message) {
    if (typeof roomSettings === "undefined") return

    let pathParts

    if (process.env.NODE_ENV === "production") {
      // @ts-expect-error Production has a different object.
      pathParts = peer.ctx.node.req.url.split("/")
    } else pathParts = new URL(peer.request?.url!).pathname.split("/")

    const roomUuid = pathParts[pathParts.length - 1]

    const payload: { type: string; data: unknown } = JSON.parse(message.text())

    if (payload.type === "init" && typeof payload.data === "string") {
      const usersWithToken = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.token, payload.data))
        .execute()

      if (usersWithToken.length !== 1) return

      const user = usersWithToken[0]
      const userDataUser = Object.values(userData[roomUuid] ?? []).find(
        (entry) => entry.user.id === user.id,
      )

      if (!(user.id in Object.keys(currentUserData[roomUuid] ?? []))) {
        if (!currentUserData[roomUuid]) currentUserData[roomUuid] = {}

        currentUserData[roomUuid][peer.toString()] = {
          ...userDataUser,
          user: user as UserData[0]["user"],
        }
      }

      let newUserData: UserData = {}

      Object.entries(currentUserData[roomUuid] ?? []).forEach(
        ([key, entry]) => {
          if (!roomSettings) return
          if (!currentUserData[roomUuid]) currentUserData[roomUuid] = {}

          newUserData[key] = {
            ...currentUserData[roomUuid][key],
            estimate:
              roomSettings[roomUuid]?.showCards ||
              !entry.estimate ||
              entry.user.id === user.id
                ? entry.estimate
                : estimateRedactedString,
          }
        },
      )

      peer.send({ user: "server", type: "init", data: newUserData })
      peer.send({
        user: "server",
        type: "roomSettings",
        data: roomSettings[roomUuid],
      })

      peer.publish(`poker_${roomUuid}`, {
        user: peer.toString(),
        type: "join",
        data: {
          ...newUserData[peer.toString()],
          estimate:
            roomSettings[roomUuid]?.showCards || !userDataUser?.estimate
              ? userDataUser?.estimate
              : estimateRedactedString,
        },
      })

      return
    }

    if (payload.type === "estimate") {
      if (!currentUserData[roomUuid])
        currentUserData[roomUuid] = userData[roomUuid] ?? {}

      currentUserData[roomUuid][peer.toString()].estimate =
        payload.data as UserData[0]["estimate"]

      peer.publish(`poker_${roomUuid}`, {
        user: peer.toString(),
        type: "estimate",
        data:
          roomSettings[roomUuid]?.showCards || !payload.data
            ? payload.data
            : estimateRedactedString,
      })

      return
    }

    if (
      payload.type === "toggleCardVisibility" &&
      typeof payload.data === "string"
    ) {
      if (!roomSettings) return
      if (!currentUserData[roomUuid]) currentUserData[roomUuid] = {}

      const usersWithToken = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.token, payload.data))
        .execute()

      if (usersWithToken.length !== 1) return

      const user = usersWithToken[0]

      const peerId = currentUserData[roomUuid][peer.toString()].user.id
      if (peerId !== user.id) return

      db.update(rooms)
        .set({ showCards: !roomSettings[roomUuid].showCards })
        .where(eq(rooms.id, roomSettings[roomUuid].id))
        .run()

      roomSettings[roomUuid].showCards = !roomSettings[roomUuid].showCards

      peer.send({ user: "server", type: "toggleCardVisibility" })
      peer.publish(`poker_${roomUuid}`, {
        user: "server",
        type: "toggleCardVisibility",
      })

      Object.entries(currentUserData[roomUuid]).forEach(([uuid, data]) => {
        if (!roomSettings) return

        peer.send({
          user: uuid,
          type: "estimate",
          data:
            roomSettings[roomUuid]?.showCards || !data.estimate
              ? data.estimate
              : estimateRedactedString,
        })

        peer.publish(`poker_${roomUuid}`, {
          user: uuid,
          type: "estimate",
          data:
            roomSettings[roomUuid]?.showCards || !data.estimate
              ? data.estimate
              : estimateRedactedString,
        })
      })

      return
    }

    if (payload.type === "clearEstimates" && typeof payload.data === "string") {
      if (!roomSettings) return
      if (!currentUserData[roomUuid]) currentUserData[roomUuid] = {}

      const usersWithToken = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.token, payload.data))
        .execute()

      if (usersWithToken.length !== 1) return

      const user = usersWithToken[0]

      const peerId = currentUserData[roomUuid][peer.toString()].user.id
      if (peerId !== user.id) return

      Object.entries(currentUserData[roomUuid]).forEach(([uuid]) => {
        if (!currentUserData[roomUuid]) return
        currentUserData[roomUuid][uuid].estimate = undefined

        peer.send({
          user: uuid,
          type: "estimate",
          data: undefined,
        })

        peer.publish(`poker_${roomUuid}`, {
          user: uuid,
          type: "estimate",
          data: undefined,
        })
      })

      return
    }

    if (
      payload.type === "setCards" &&
      payload.data &&
      typeof payload.data === "object" &&
      "token" in payload.data &&
      "cards" in payload.data
    ) {
      if (!currentUserData[roomUuid]) return

      const usersWithToken = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.token, payload.data.token as string))
        .execute()

      if (usersWithToken.length !== 1) return

      const user = usersWithToken[0]

      const peerId = currentUserData[roomUuid][peer.toString()].user.id

      if (peerId !== user.id) return
      if (
        !roomSettings[roomUuid].admins.includes(user.id) &&
        roomSettings[roomUuid].owner !== user.id
      )
        return

      const cardsMap: Map<string, boolean> = new Map()
      const cardsArray: string[] = []

      let cards = payload.data.cards as string
      cards.split(",").filter(Boolean).join(",")

      for (const card of cards.split(",").filter(Boolean)) {
        cardsMap.set(card, true)
      }

      for (const card of cardsMap.keys()) {
        cardsArray.push(card)
      }

      cards = cardsArray.join(",")

      db.update(rooms)
        .set({ cards })
        .where(eq(rooms.id, roomSettings[roomUuid].id))
        .run()

      roomSettings[roomUuid].cards = cards

      peer.send({
        user: peer.toString(),
        type: "setCards",
        data: roomSettings[roomUuid].cards,
      })

      peer.publish(`poker_${roomUuid}`, {
        user: peer.toString(),
        type: "setCards",
        data: roomSettings[roomUuid].cards,
      })

      return
    }

    const msg = {
      user: peer.toString(),
      data: currentUserData[roomUuid]?.toString(),
    }

    peer.send(msg)
    peer.publish(`poker_${roomUuid}`, msg)
  },
  close(peer) {
    let pathParts

    if (process.env.NODE_ENV === "production") {
      // @ts-expect-error Production has a different object.
      pathParts = peer.ctx.node.req.url.split("/")
    } else pathParts = new URL(peer.request?.url!).pathname.split("/")

    const roomUuid = pathParts[pathParts.length - 1]
    if (!currentUserData[roomUuid])
      currentUserData[roomUuid] = userData[roomUuid] ?? {}

    const peerUuid = (Object.entries(userData[roomUuid] ?? []).find(
      ([_, entry]) => {
        if (!currentUserData[roomUuid]) return

        entry.user.id === currentUserData[roomUuid][peer.toString()].user.id
      },
    ) ?? [peer.toString()])[0]

    if (!userData[roomUuid]) userData[roomUuid] = {}

    userData[roomUuid][peerUuid] = {
      ...currentUserData[roomUuid][peer.toString()],
    }

    delete currentUserData[roomUuid][peer.toString()]

    peer.publish(`poker_${roomUuid}`, {
      user: "server",
      type: "leave",
      data: peer.toString(),
    })
  },
})
