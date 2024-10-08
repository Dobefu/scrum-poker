import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"
import { UserData } from "~/types/user-data"

const estimateRedactedString = "<HIDDEN>"

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

      if (!(user.id in Object.keys(userData))) {
        userData[peer.toString()] = {
          user: user as UserData[0]["user"],
        }
      }

      peer.send({ user: "server", type: "init", data: userData })
      peer.send({ user: "server", type: "roomSettings", data: roomSettings })

      peer.publish("poker", {
        user: peer.toString(),
        type: "join",
        data: userData[peer.toString()],
      })

      return
    }

    if (payload.type === "estimate") {
      userData[peer.toString()].estimate =
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

      const peerId = userData[peer.toString()].user.id
      if (peerId !== user.id) return

      db.update(rooms)
        .set({ showCards: !roomSettings.showCards })
        .where(eq(rooms.id, roomSettings.id))
        .run()

      roomSettings.showCards = !roomSettings.showCards

      peer.send({ user: "server", type: "toggleCardVisibility" })
      peer.publish("poker", { user: "server", type: "toggleCardVisibility" })

      Object.entries(userData).forEach(([uuid, data]) => {
        console.log(userData.estimate)

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
      data: userData.toString(),
    }

    peer.send(msg)
    peer.publish("poker", msg)
  },
  close(peer) {
    delete userData[peer.toString()]

    peer.publish("poker", {
      user: "server",
      type: "leave",
      data: peer.toString(),
    })
  },
})
