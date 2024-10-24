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
		log.Panicln("websocket upgrade:", err)
		return
	}

	defer conn.Close()

	db, err := sql.Open("sqlite3", "../db/db.sqlite")

	if err != nil {
		log.Panicln("database:", err)
		return
	}

	room, err := database.GetRoomDataByUuid(db, r.PathValue("roomUuid"))

	if err != nil {
		log.Println("get room:", err)
		return
	}

	for {
		mt, message, err := conn.ReadMessage()

		if err != nil {
			log.Println("websocket read:", err)
			break
		}

		var data map[string]interface{}
		json.Unmarshal(message, &data)

		err = handleCommands(data, mt, conn, db, room)

		if err != nil {
			log.Println("handle command:", err)
			break
		}
	}
}

func handleCommands(
	payload map[string]interface{},
	mt int,
	conn *websocket.Conn,
	db *sql.DB,
	room *database.Room,
	) (error) {
	msgType, ok := payload["type"]

	if !ok {
		return errors.New("the payload does not provide a type")
	}

	switch (msgType) {
	case "init":
		return handleInit(payload, mt, conn, db, room)
	}

	return fmt.Errorf("invalid command: %s", msgType)
}

func handleInit(
	payload map[string]interface{},
	mt int,
	conn *websocket.Conn,
	db *sql.DB,
	room *database.Room,
	) (error) {
		user, err := database.GetUserByToken(db, fmt.Sprint(payload["data"]))

		if err != nil {
			log.Println("get user by token:", err)
			return err
		}

	if _, ok := roomData[room.UUID]; !ok {
		roomData[room.UUID] = server.RoomData{
			RoomSettings: server.RoomSettings{},
			Users: map[uint32]server.UserData{},
		}
	}

	if _, ok := roomData[room.UUID].Users[user.ID]; !ok {
		roomData[room.UUID].Users[user.ID] = server.UserData{
			User: *user,
		}
	}

	response := map[string]interface{}{
		"user": "server",
		"type": "init",
		"data": roomData[room.UUID],
	}

	responseJson, err := json.Marshal(response)

	if err != nil {
		log.Println("encode JSON:", err)
		return err
	}

	err = conn.WriteMessage(mt, responseJson)

	if err != nil {
		log.Println("init:", err)
		return err
	}

	log.Println(roomData[room.UUID].Users[user.ID])

	return nil
}
