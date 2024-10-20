package cmds

import (
	"log"
	"net/http"
	"slices"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{CheckOrigin: checkOrigin}

func Server() (error) {
	http.HandleFunc("/ws", ws)

	log.Println("Starting server on :4000")
	log.Fatal(http.ListenAndServe(":4000", nil))

	return nil
}

func checkOrigin (r *http.Request) bool {
	allowedOrigins := []string{
		"http://localhost:3000",
		"https://scrum-poker.connor.nl",
	}

	return slices.Contains(allowedOrigins, r.Header["Origin"][0])
}

func ws(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
		return
	}

	defer conn.Close()

	for {
		mt, message, err := conn.ReadMessage()

		if err != nil {
			log.Println("read:", err)
			break
		}

		log.Printf("recv: %s", message)
		err = conn.WriteMessage(mt, message)

		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}
