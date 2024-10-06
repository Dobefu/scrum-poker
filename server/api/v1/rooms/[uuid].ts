export default defineWebSocketHandler({
  open(peer) {
    peer.publish("poker", { user: peer.toString(), message: "join" })
    peer.subscribe("poker")
  },
  message(peer, message) {
    if (message.text() === "join") {
      peer.send({ user: "server", message: "" })
    } else {
      const msg = {
        user: peer.toString(),
        message: message.toString(),
      }

      peer.send(msg)
      peer.publish("poker", msg)
    }
  },
  close(peer) {
    peer.publish("poker", { user: peer.toString(), message: "leave" })
  },
})
