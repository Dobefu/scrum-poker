package routes

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"scrumpoker/database"
	"scrumpoker/server"
	"slices"
	"strings"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

var roomData = map[string]server.RoomData{}
var upgrader = websocket.Upgrader{
	CheckOrigin:     checkOrigin,
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
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
	for _, roomUser := range roomData[room.UUID].Users {
		if roomUser.User.ID == user.ID {
			continue
		}

		err := roomUser.Conn.WriteJSON(message)

		if err != nil {
			return err
		}
	}

	return nil
}

func isAdmin(
	room *database.Room,
	user *database.User,
) bool {
	return user.ID == roomData[room.UUID].RoomSettings.Owner ||
		slices.Contains(roomData[room.UUID].RoomSettings.Admins, user.ID)
}

func Ws(w http.ResponseWriter, r *http.Request) {
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
	case "ping":
		return handlePing(conn)
	case "estimate":
		return handleEstimate(conn, room, user, payload)
	case "toggleCardVisibility":
		return handleToggleCardVisibility(conn, db, room, user)
	case "updateSettings":
		return handleUpdateSettings(conn, db, room, user, payload)
	case "clearEstimates":
		return handleClearEstimates(conn, db, room, user)
	case "toggleSpectate":
		return handleToggleSpectate(conn, db, room, user)
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
				ID:          room.ID,
				UUID:        room.UUID,
				Owner:       room.Owner,
				Name:        room.Name,
				Admins:      room.Admins,
				CreatedAt:   room.CreatedAt,
				ShowCards:   room.ShowCards,
				Cards:       room.Cards,
				AllowShow:   room.AllowShow,
				AllowDelete: room.AllowDelete,
				Spectators:  room.Spectators,
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

func handlePing(
	conn *websocket.Conn,
) error {
	response := map[string]interface{}{
		"type": "pong",
	}

	err := conn.WriteJSON(response)

	if err != nil {
		log.Println("pong:", err)
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
	if !isAdmin(room, user) && !roomData[room.UUID].RoomSettings.AllowShow {
		return fmt.Errorf("toggleCardVisibility: permission denied")
	}

	roomData[room.UUID] = server.RoomData{
		RoomSettings: server.RoomSettings{
			ID:          room.ID,
			UUID:        room.UUID,
			Owner:       room.Owner,
			Name:        room.Name,
			Admins:      room.Admins,
			CreatedAt:   room.CreatedAt,
			ShowCards:   !roomData[room.UUID].RoomSettings.ShowCards,
			Cards:       room.Cards,
			AllowShow:   room.AllowShow,
			AllowDelete: room.AllowDelete,
			Spectators:  room.Spectators,
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

	sendEstimates(conn, room, user)

	return nil
}

func handleUpdateSettings(
	conn *websocket.Conn,
	db *sql.DB,
	room *database.Room,
	user *database.User,
	payload map[string]interface{},
) error {
	if !isAdmin(room, user) {
		return fmt.Errorf("updateSettings: permission denied")
	}

	name := payload["data"].(map[string]interface{})["name"].(string)
	cards := payload["data"].(map[string]interface{})["cards"].(string)
	allowShow := payload["data"].(map[string]interface{})["allowShow"].(bool)
	allowDelete := payload["data"].(map[string]interface{})["allowDelete"].(bool)

	if name == "" {
		name = "Poker Room"
	}

	newCards := formatCards(cards)

	roomData[room.UUID] = server.RoomData{
		RoomSettings: server.RoomSettings{
			ID:          room.ID,
			UUID:        room.UUID,
			Owner:       room.Owner,
			Name:        name,
			Admins:      room.Admins,
			CreatedAt:   room.CreatedAt,
			ShowCards:   room.ShowCards,
			Cards:       newCards,
			AllowShow:   allowShow,
			AllowDelete: allowDelete,
			Spectators:  room.Spectators,
		},
		Users: roomData[room.UUID].Users,
	}

	err := database.SetRoomSettings(db, room, name, newCards, allowShow, allowDelete)

	if err != nil {
		log.Println("updateSettings", err)
		return err
	}

	response := map[string]interface{}{
		"type": "setRoomName",
		"data": name,
	}

	err = conn.WriteJSON(response)

	if err != nil {
		log.Println("updateSettings: write setRoomName:", err)
		return err
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("updateSettings: broadcast setRoomName:", err)
		return err
	}

	response = map[string]interface{}{
		"type": "setCards",
		"data": newCards,
	}

	err = conn.WriteJSON(response)

	if err != nil {
		log.Println("updateSettings: write setCards:", err)
		return err
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("updateSettings: broadcast setCards:", err)
		return err
	}

	response = map[string]interface{}{
		"type": "setAllowShow",
		"data": allowShow,
	}

	err = conn.WriteJSON(response)

	if err != nil {
		log.Println("updateSettings: write setAllowShow:", err)
		return err
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("updateSettings: broadcast setAllowShow:", err)
		return err
	}

	response = map[string]interface{}{
		"type": "setAllowDelete",
		"data": allowDelete,
	}

	err = conn.WriteJSON(response)

	if err != nil {
		log.Println("updateSettings: write setAllowDelete:", err)
		return err
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("updateSettings: broadcast setAllowDelete:", err)
		return err
	}

	return nil
}

func handleClearEstimates(
	conn *websocket.Conn,
	db *sql.DB,
	room *database.Room,
	user *database.User,
) error {
	if !isAdmin(room, user) && !roomData[room.UUID].RoomSettings.AllowDelete {
		return fmt.Errorf("clearEstimates: permission denied")
	}

	for _, roomUser := range roomData[room.UUID].Users {
		response := map[string]interface{}{
			"type": "estimate",
			"user": roomUser.User.ID,
			"data": "",
		}

		roomData[room.UUID].Users[roomUser.User.ID] = server.UserData{
			User:     roomUser.User,
			Conn:     roomUser.Conn,
			Estimate: "",
		}

		err := roomUser.Conn.WriteJSON(response)

		if err != nil {
			log.Println("clearEstimates: write:", err)
			return err
		}

		err = broadcast(room, &roomUser.User, response)

		if err != nil {
			log.Println("clearEstimates: broadcast:", err)
			return err
		}

		if roomData[room.UUID].RoomSettings.ShowCards {
			handleToggleCardVisibility(conn, db, room, user)
		}
	}

	return nil
}

func handleToggleSpectate(
	conn *websocket.Conn,
	db *sql.DB,
	room *database.Room,
	user *database.User,
) error {
	spectators := roomData[room.UUID].RoomSettings.Spectators

	if slices.Contains(room.Spectators, user.ID) {
		for index, uid := range spectators {
			if uid != user.ID {
				continue
			}

			spectators = slices.Delete(spectators, index, index+1)
		}
	} else {
		spectators = append(spectators, user.ID)
	}

	room.Spectators = spectators

	err := database.SetRoomSpectators(db, room, spectators)

	if err != nil {
		log.Println("toggleSpectate: setRoomSpectators:", err)
		return err
	}

	roomData[room.UUID] = server.RoomData{
		RoomSettings: server.RoomSettings{
			ID:          room.ID,
			UUID:        room.UUID,
			Owner:       room.Owner,
			Name:        room.Name,
			Admins:      room.Admins,
			CreatedAt:   room.CreatedAt,
			ShowCards:   room.ShowCards,
			Cards:       room.Cards,
			AllowShow:   room.AllowShow,
			AllowDelete: room.AllowDelete,
			Spectators:  spectators,
		},
		Users: roomData[room.UUID].Users,
	}

	response := map[string]interface{}{
		"type": "setSpectators",
		"data": room.Spectators,
	}

	err = conn.WriteJSON(response)

	if err != nil {
		log.Println("setSpectators: write:", err)
		return err
	}

	err = broadcast(room, user, response)

	if err != nil {
		log.Println("setSpectators: broadcast:", err)
		return err
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

func formatCards(cards string) string {
	cardsSlice := strings.Split(cards, ",")
	newCards := ""

	for _, card := range cardsSlice {
		if card == "" {
			continue
		}

		if newCards != "" {
			newCards += ","
		}

		newCards += card
	}

	if newCards == "" {
		newCards = "?,∞,0,1,2,3,5,8,13,20,40,100"
	}

	return newCards
}

func sendEstimates(
	conn *websocket.Conn,
	room *database.Room,
	user *database.User,
) error {
	for _, roomUser := range roomData[room.UUID].Users {
		estimate := roomUser.Estimate

		if !roomData[room.UUID].RoomSettings.ShowCards && estimate != "" {
			estimate = "<HIDDEN>"
		}

		response := map[string]interface{}{
			"type": "estimate",
			"data": estimate,
			"user": roomUser.User.ID,
		}

		if roomUser.User.ID != user.ID {
			err := conn.WriteJSON(response)

			if err != nil {
				log.Println("estimate: write:", err)
				return err
			}
		}

		err := broadcast(room, user, response)

		if err != nil {
			log.Println("estimate: broadcast:", err)
			return err
		}
	}

	return nil
}
