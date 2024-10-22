package database

import "database/sql"

func GetRoomDataByUuid(db *sql.DB, uuid string) (*Room, error) {
	room := Room{}

	err := db.QueryRow(
		"SELECT id FROM rooms WHERE token=?;",
		uuid,
	).Scan(&room.ID)

	if err != nil {
		return nil, err
	}

	return &room, nil
}

func GetUserByToken(db *sql.DB, token string) (*User, error) {
	user := User{}

	err := db.QueryRow(
		"SELECT id FROM users WHERE token=?;",
		token,
	).Scan(&user.ID)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
