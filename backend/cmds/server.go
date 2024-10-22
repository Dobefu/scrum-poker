package cmds

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"scrumpoker/database"
	"slices"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

var upgrader = websocket.Upgrader{CheckOrigin: checkOrigin}

func Server() (error) {
	http.HandleFunc("/api/v1/rooms/{roomUuid}", ws)

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

	db, err := sql.Open("sqlite3", "../db/db.sqlite")

	if err != nil {
		log.Println(err)
		return
	}

	room, err := database.GetRoomDataByUuid(db, r.PathValue("roomUuid"))

	if err != nil {
		log.Println(err)
		return
	}

	for {
		mt, message, err := conn.ReadMessage()

		if err != nil {
			log.Println("read:", err)
			break
		}

		var data map[string]interface{}
		json.Unmarshal(message, &data)

		user, err := database.GetUserByToken(db, fmt.Sprint(data["data"]))

		if err != nil {
			log.Println(err)
			return
		}

		output, err := handleCommands(data, room, user)

		if err != nil {
			log.Println(err)
			break
		}

		log.Println(output)

		err = conn.WriteMessage(mt, message)

		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func handleCommands(payload map[string]interface{}, room *database.Room, user *database.User) (any, error) {
	msgType, ok := payload["type"]

	if !ok {
		return nil, errors.New("the payload does not provide a type")
	}

	switch (msgType) {
	case "init":
		return handleInit(room, user)
	}

	return nil, fmt.Errorf("invalid command: %s", msgType)
}

func handleInit(room *database.Room, user *database.User) (any, error) {
	return nil, nil
}
