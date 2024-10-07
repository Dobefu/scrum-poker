const data: Record<string, object> = {}

export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe("poker")
  },
  message(peer, message) {
    const payload = JSON.parse(message.text())

    if (payload.type === "init") {
      if (!(peer.toString() in Object.keys(data))) {
        data[peer.toString()] = {
          user: payload.data,
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
