package cmds

import (
	"database/sql"
	"encoding/json"
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

	room, err := getRoomDataByUuid(db, r.PathValue("roomUuid"))

	if err != nil {
		log.Println(err)
		return
	}

	log.Println(room.ID)

	for {
		mt, message, err := conn.ReadMessage()

		if err != nil {
			log.Println("read:", err)
			break
		}

		var data map[string]interface{}
		json.Unmarshal(message, &data)

		log.Printf("recv: %s", message)

		user, err := getUserByToken(db, fmt.Sprint(data["data"]))

		if err != nil {
			log.Println(err)
			return
		}

		log.Println(user.ID)

		err = conn.WriteMessage(mt, message)

		if err != nil {
			log.Println("write:", err)
			break
		}
	}
}

func getRoomDataByUuid(db *sql.DB, uuid string) (*database.Room, error) {
	rows, err := db.Query(
		"SELECT id FROM rooms WHERE token=?;",
		uuid,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		room := database.Room{}

		err = rows.Scan(&room.ID)

		return &room, err
	}

	return nil, nil
}

func getUserByToken(db *sql.DB, token string) (*database.User, error) {
	rows, err := db.Query(
		"SELECT id FROM users WHERE token=?;",
		token,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		user := database.User{}

		err = rows.Scan(&user.ID)

		return &user, err
	}

	return nil, nil
}
