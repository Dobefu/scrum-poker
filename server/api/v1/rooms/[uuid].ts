const data: Record<string, string> = {}

export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe("poker")

    if (!(peer.toString() in Object.keys(data))) data[peer.toString()] = "test"

    peer.publish("poker", {
      user: peer.toString(),
      type: "join",
      data: data[peer.toString()],
    })
  },
  message(peer, message) {
    if (message.text() === "init") {
      peer.send({ user: "server", type: "init", data })
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
