package cmds

import (
	"database/sql"
	"fmt"
	"scrumpoker/database"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func Cron() (error) {
	db, err := sql.Open("sqlite3", "../db/db.sqlite")

	if err != nil {
		return err
	}

	err = cleanupUsers(db)

	if err != nil {
		return err
	}

	err = cleanupRooms(db)

	if err != nil {
		return err
	}

	return nil
}

func cleanupUsers(db *sql.DB) (error) {
	rows, err := db.Query(
		"SELECT id FROM users WHERE last_active < ?;",
		time.Now().Unix()-86400,
	)

	if err != nil {
		return err
	}

	defer rows.Close()

	users := []database.User{}

	for rows.Next() {
		user := database.User{}

		err = rows.Scan(&user.ID)

		if err != nil {
			return err
		}

		users = append(users, user)
	}

	for _, user := range users {
		fmt.Printf("Cleaning up user: %d\n", user.ID)

		_, err := db.Exec("DELETE from users where id=?", user.ID)

		if err != nil {
			return err
		}
	}

	return nil
}

func cleanupRooms(db *sql.DB) (error) {
	rows, err := db.Query(
		"SELECT rooms.id FROM rooms LEFT JOIN users ON users.id = rooms.owner WHERE users.id IS NULL;",
	)

	if err != nil {
		return err
	}

	defer rows.Close()


	roomIDs := []uint32{}

	for rows.Next() {
		var roomID uint32

		err = rows.Scan(&roomID)

		if err != nil {
			return err
		}

		roomIDs = append(roomIDs, roomID)
	}

	for _, roomID := range roomIDs {
		fmt.Printf("Cleaning up room: %d\n", roomID)

		_, err := db.Exec("DELETE from rooms where id=?", roomID)

		if err != nil {
			return err
		}
	}

	return nil
}
