package cmds

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"scrumpoker/database"
	"scrumpoker/server"
	"slices"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

var upgrader = websocket.Upgrader{CheckOrigin: checkOrigin}
var roomData = map[string]server.RoomData{}

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

		output, err := handleCommands(mt, conn, data, room, user)

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

func handleCommands(
	mt int,
	conn *websocket.Conn,
	payload map[string]interface{},
	room *database.Room,
	user *database.User,
	) (any, error) {
	msgType, ok := payload["type"]

	if !ok {
		return nil, errors.New("the payload does not provide a type")
	}

	switch (msgType) {
	case "init":
		return handleInit(mt, conn, room, user)
	}

	return nil, fmt.Errorf("invalid command: %s", msgType)
}

func handleInit(
	mt int,
	conn *websocket.Conn,
	room *database.Room,
	user *database.User,
	) (any, error) {
	if _, ok := roomData[room.UUID]; !ok {
		roomData[room.UUID] = server.RoomData{
			RoomSettings:server.RoomSettings{},
			Users: map[uint32]database.User{},
		}
	}

	if _, ok := roomData[room.UUID].Users[user.ID]; !ok {
		roomData[room.UUID].Users[user.ID] = *user
	}

	response, err := json.Marshal(`{ user: "server", type: "init", data: undefined }`)

	if err != nil {
		log.Println("init:", err)
		return nil, err
	}

	err = conn.WriteMessage(mt, response)

	if err != nil {
		log.Println("init:", err)
		return nil, err
	}

	log.Println(roomData[room.UUID].Users[user.ID])

	return nil, nil
}
