package cmds

import (
	"log"
	"net/http"
	"scrumpoker/cmds/routes"

	_ "github.com/mattn/go-sqlite3"
)

func Server() error {
	http.HandleFunc("/api/v1/rooms/{roomUuid}", routes.Ws)

	log.Println("Starting server on :4000")
	log.Fatal(http.ListenAndServe(":4000", nil))

	return nil
}
