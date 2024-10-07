import { UserData } from "~/types/user-data"

const data: UserData = {}

export default defineWebSocketHandler({
  open(peer) {
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

      peer.publish("poker", {
        user: peer.toString(),
        type: "join",
        data: data[peer.toString()],
      })

      return
    }

    if (payload.type === "estimate") {
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
