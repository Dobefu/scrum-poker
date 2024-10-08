import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"
import { UserData } from "~/types/user-data"

const data: UserData = {}
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

    if (payload.type === "init") {
      if (!(peer.toString() in Object.keys(data))) {
        data[peer.toString()] = {
          user: {
            ...(payload.data as UserData[0]["user"]),
            token: undefined,
          } as UserData[0]["user"],
        }
      }

      peer.send({ user: "server", type: "init", data })
      peer.send({ user: "server", type: "roomSettings", data: roomSettings })

      peer.publish("poker", {
        user: peer.toString(),
        type: "join",
        data: data[peer.toString()],
      })

      return
    }

    if (payload.type === "estimate") {
      data[peer.toString()].estimate = payload.data as UserData[0]["estimate"]

      peer.publish("poker", {
        user: peer.toString(),
        type: "estimate",
        data: payload.data,
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

      const peerId = data[peer.toString()].user.id
      if (peerId !== user.id) return

      db.update(rooms)
        .set({ showCards: !roomSettings.showCards })
        .where(eq(rooms.id, roomSettings.id))
        .run()

      roomSettings.showCards = !roomSettings.showCards

      peer.send({ user: "server", type: "toggleCardVisibility" })
      peer.publish("poker", { user: "server", type: "toggleCardVisibility" })

      return
    }

    const msg = {
      user: peer.toString(),
      data: data.toString(),
    }

    peer.send(msg)
    peer.publish("poker", msg)
  },
  close(peer) {
    delete data[peer.toString()]

    peer.publish("poker", {
      user: "server",
      type: "leave",
      data: peer.toString(),
    })
  },
})
