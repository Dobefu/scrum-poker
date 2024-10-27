package cmds

import (
	"database/sql"
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

var roomData = map[string]server.RoomData{}
var upgrader = websocket.Upgrader{
	CheckOrigin:     checkOrigin,
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func Server() error {
	http.HandleFunc("/api/v1/rooms/{roomUuid}", ws)

	log.Println("Starting server on :4000")
	log.Fatal(http.ListenAndServe(":4000", nil))

	return nil
}

func checkOrigin(r *http.Request) bool {
	allowedOrigins := []string{
		"http://localhost:3000",
		"https://scrum-poker.connor.nl",
	}

	return slices.Contains(allowedOrigins, r.Header["Origin"][0])
}

func broadcast(
	room *database.Room,
	user *database.User,
	message interface{},
) error {
	for roomUser := range roomData[room.UUID].Users {
		if roomUser == user.ID {
			continue
		}

		err := roomData[room.UUID].Users[roomUser].Conn.WriteJSON(message)

		if err != nil {
			return err
		}
	}

	return nil
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

	tokenCookie, err := r.Cookie("auth-token")

	if err != nil {
		log.Println("get auth-token cookie:", err)
		return
	}

	token := tokenCookie.Value
	user, err := database.GetUserByToken(db, token)

	if err != nil {
		log.Println("get user by token:", err)
		return
	}

	for {
		var data map[string]interface{}
		err := conn.ReadJSON(&data)

		if err != nil {
			log.Println("websocket read:", err)
			handleLeave(room, user)
			break
		}

		err = handleCommands(db, data, conn, room, user)

		if err != nil {
			log.Println("handle commands:", err)
		}
	}
}

func handleCommands(
	db *sql.DB,
	payload map[string]interface{},
	conn *websocket.Conn,
	room *database.Room,
	user *database.User,
) error {
	msgType, ok := payload["type"]

	if !ok {
		return errors.New("the payload does not provide a type")
	}

	switch msgType {
	case "init":
		return handleInit(conn, room, user)
	case "estimate":
		return handleEstimate(conn, room, user, payload)
	case "toggleCardVisibility":
		return handleToggleCardVisibility(conn, db, room, user)
	}

	return fmt.Errorf("invalid command: %s", msgType)
}

func handleInit(
	conn *websocket.Conn,
	room *database.Room,
	user *database.User,
) error {
	if _, ok := roomData[room.UUID]; !ok {
		roomData[room.UUID] = server.RoomData{
			RoomSettings: server.RoomSettings{
				ID:        room.ID,
				UUID:      room.UUID,
				Owner:     room.Owner,
				Name:      room.Name,
				Admins:    room.Admins,
				CreatedAt: room.CreatedAt,
				ShowCards: room.ShowCards,
				Cards:     room.Cards,
			},
			Users: map[uint32]server.UserData{},
		}
	}

	if _, ok := roomData[room.UUID].Users[user.ID]; !ok {
		roomData[room.UUID].Users[user.ID] = server.UserData{
			User: *user,
			Conn: conn,
		}
	}

	response := map[string]interface{}{
		"type": "init",
		"data": roomData[room.UUID],
	}

	err := conn.WriteJSON(response)

	if err != nil {
		log.Println("init:", err)
		return err
	}

	response = map[string]interface{}{
		"type": "join",
		"data": roomData[room.UUID].Users[user.ID],
		"user": user.ID,
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("join:", err)
		return err
	}

	return nil
}

func handleEstimate(
	conn *websocket.Conn,
	room *database.Room,
	user *database.User,
	payload map[string]interface{},
) error {
	estimate := payload["data"].(string)

	roomData[room.UUID].Users[user.ID] = server.UserData{
		User:     *user,
		Conn:     conn,
		Estimate: estimate,
	}

	if !roomData[room.UUID].RoomSettings.ShowCards && estimate != "" {
		estimate = "<HIDDEN>"
	}

	response := map[string]interface{}{
		"type": "estimate",
		"user": user.ID,
		"data": estimate,
	}

	err := broadcast(room, user, response)

	if err != nil {
		log.Println("estimate:", err)
		return err
	}

	return nil
}

func handleToggleCardVisibility(
	conn *websocket.Conn,
	db *sql.DB,
	room *database.Room,
	user *database.User,
) error {
	roomData[room.UUID] = server.RoomData{
		RoomSettings: server.RoomSettings{
			ID:        room.ID,
			UUID:      room.UUID,
			Owner:     room.Owner,
			Name:      room.Name,
			Admins:    room.Admins,
			CreatedAt: room.CreatedAt,
			ShowCards: !roomData[room.UUID].RoomSettings.ShowCards,
			Cards:     room.Cards,
		},
		Users: roomData[room.UUID].Users,
	}

	err := database.SetRoomCardVisibility(db, room, user, roomData[room.UUID].RoomSettings.ShowCards)

	if err != nil {
		log.Println("toggleCardVisibility:", err)
		return err
	}

	response := map[string]interface{}{
		"type": "toggleCardVisibility",
	}

	err = conn.WriteJSON(response)

	if err != nil {
		return err
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("toggleCardVisibility: broadcast:", err)
		return err
	}

	for roomUser := range roomData[room.UUID].Users {
		estimate := roomData[room.UUID].Users[roomUser].Estimate

		if !roomData[room.UUID].RoomSettings.ShowCards && estimate != "" {
			estimate = "<HIDDEN>"
		}

		response = map[string]interface{}{
			"type": "estimate",
			"data": estimate,
			"user": roomUser,
		}

		if roomUser != user.ID {
			err := conn.WriteJSON(response)

			if err != nil {
				return err
			}
		}

		err = broadcast(room, user, response)

		if err != nil {
			log.Println("estimate:", err)
			return err
		}
	}

	return nil
}

func handleLeave(
	room *database.Room,
	user *database.User,
) error {
	delete(roomData[room.UUID].Users, user.ID)

	response := map[string]interface{}{
		"type": "leave",
		"data": user.ID,
	}

	err := broadcast(room, user, response)

	if err != nil {
		log.Println("leave:", err)
		return err
	}

	return nil
}
