package database

import "database/sql"

func GetRoomDataByUuid(db *sql.DB, uuid string) (*Room, error) {
	room := Room{}

	err := db.QueryRow(
		"SELECT id, token, owner, show_cards, name FROM rooms WHERE token=?;",
		uuid,
	).Scan(&room.ID, &room.UUID, &room.Owner, &room.ShowCards, &room.Name)

	if err != nil {
		return nil, err
	}

	return &room, nil
}

func GetUserByToken(db *sql.DB, token string) (*User, error) {
	user := User{}

	err := db.QueryRow(
		"SELECT id, name, room FROM users WHERE token=?;",
		token,
	).Scan(&user.ID, &user.Name, &user.Room)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
