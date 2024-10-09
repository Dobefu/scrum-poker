import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"
import { UserData } from "~/types/user-data"

const estimateRedactedString = "<HIDDEN>"

const currentUserData: UserData = {}
const userData: UserData = {}
const { db } = useDatabase()
let roomSettings: (typeof rooms)["$inferSelect"] | undefined

export default defineWebSocketHandler({
  async open(peer) {
    const url = new URL(peer.request?.url!)
    const pathParts = url.pathname.split("/")
    const roomUuid = pathParts[pathParts.length - 1]

    roomSettings = (
      await db.select().from(rooms).where(eq(rooms.uuid, roomUuid))
    )[0]

    peer.subscribe("poker")
  },
  async message(peer, message) {
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
      const userDataUser = Object.values(userData).find(
        (entry) => entry.user.id === user.id,
      )

      if (!(user.id in Object.keys(currentUserData))) {
        currentUserData[peer.toString()] = {
          ...userDataUser,
          user: user as UserData[0]["user"],
        }
      }

      let newUserData: UserData = {}

      Object.entries(currentUserData).forEach(([key, entry]) => {
        newUserData[key] = {
          ...currentUserData[key],
          estimate:
            roomSettings?.showCards ||
            !entry.estimate ||
            entry.user.id === user.id
              ? entry.estimate
              : estimateRedactedString,
        }
      })

      peer.send({ user: "server", type: "init", data: newUserData })
      peer.send({ user: "server", type: "roomSettings", data: roomSettings })

      peer.publish("poker", {
        user: peer.toString(),
        type: "join",
        data: {
          ...newUserData[peer.toString()],
          estimate:
            roomSettings?.showCards || !userDataUser?.estimate
              ? userDataUser?.estimate
              : estimateRedactedString,
        },
      })

      return
    }

    if (payload.type === "estimate") {
      currentUserData[peer.toString()].estimate =
        payload.data as UserData[0]["estimate"]

      peer.publish("poker", {
        user: peer.toString(),
        type: "estimate",
        data:
          roomSettings?.showCards || !payload.data
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

      const usersWithToken = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.token, payload.data))
        .execute()

      if (usersWithToken.length !== 1) return

      const user = usersWithToken[0]

      const peerId = currentUserData[peer.toString()].user.id
      if (peerId !== user.id) return

      db.update(rooms)
        .set({ showCards: !roomSettings.showCards })
        .where(eq(rooms.id, roomSettings.id))
        .run()

      roomSettings.showCards = !roomSettings.showCards

      peer.send({ user: "server", type: "toggleCardVisibility" })
      peer.publish("poker", { user: "server", type: "toggleCardVisibility" })

      Object.entries(currentUserData).forEach(([uuid, data]) => {
        peer.send({
          user: uuid,
          type: "estimate",
          data:
            roomSettings?.showCards || !data.estimate
              ? data.estimate
              : estimateRedactedString,
        })

        peer.publish("poker", {
          user: uuid,
          type: "estimate",
          data:
            roomSettings?.showCards || !data.estimate
              ? data.estimate
              : estimateRedactedString,
        })
      })

      return
    }

    const msg = {
      user: peer.toString(),
      data: currentUserData.toString(),
    }

    peer.send(msg)
    peer.publish("poker", msg)
  },
  close(peer) {
    const peerUuid = (Object.entries(userData).find(
      ([_, entry]) =>
        entry.user.id === currentUserData[peer.toString()].user.id,
    ) ?? [peer.toString()])[0]

    userData[peerUuid] = { ...currentUserData[peer.toString()] }
    delete currentUserData[peer.toString()]

    peer.publish("poker", {
      user: "server",
      type: "leave",
      data: peer.toString(),
    })
  },
})
