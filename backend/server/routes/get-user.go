package routes

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"scrumpoker/database"
)

func GetUser(w http.ResponseWriter, r *http.Request) {
	db, err := sql.Open("sqlite3", "../db/db.sqlite")

	if err != nil {
		log.Panicln("database:", err)
		return
	}

	var body map[string]string
	decode := json.NewDecoder(r.Body)

	err = decode.Decode(&body)

	if err != nil {
		log.Println("get-user: decode body:", err)
		return
	}

	user, err := database.GetUserByToken(db, body["token"])

	if err != nil {
		log.Println("get-user: getUserByToken:", err)
		return
	}

	user.Token = body["token"]
	result, err := json.Marshal(user)

	if err != nil {
		log.Println("JSON marshal user:", err)
		return
	}

	w.Write(result)
}
