package routes

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"scrumpoker/database"
)

func GetRoom(w http.ResponseWriter, r *http.Request) {
	db, err := sql.Open("sqlite3", "../db/db.sqlite")

	if err != nil {
		log.Panicln("database:", err)

		return
	}

	roomUUID := r.PathValue("roomUuid")
	room, err := database.GetRoomDataByUuid(db, roomUUID)

	if err != nil {
		log.Panicln("getRoomDataByUuid:", err)

		return
	}

	result, err := json.Marshal(room)

	if err != nil {
		log.Panicln("JSON marshal room:", err)

		return
	}

	_, _ = w.Write(result)
}
