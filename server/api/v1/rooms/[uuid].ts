import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms } from "~/db/schema"
import { UserData } from "~/types/user-data"

const data: UserData = {}
const { db } = useDatabase()
let roomSettings = {}

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
  message(peer, message) {
    const payload: { type: string; data: unknown } = JSON.parse(message.text())

    if (payload.type === "init") {
      if (!(peer.toString() in Object.keys(data))) {
        data[peer.toString()] = {
          user: payload.data as UserData[0]["user"],
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
