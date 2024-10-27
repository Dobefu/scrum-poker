package database

import (
	"database/sql"
	"encoding/json"
)

func GetRoomDataByUuid(db *sql.DB, uuid string) (*Room, error) {
	room := Room{}
	var admins []uint8

	err := db.QueryRow(
		"SELECT id, token, owner, json, cards, show_cards, name FROM rooms WHERE token=?;",
		uuid,
	).Scan(&room.ID, &room.UUID, &room.Owner, &admins, &room.Cards, &room.ShowCards, &room.Name)

	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(admins, &room.Admins)

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

func SetRoomCardVisibility(
	db *sql.DB,
	room *Room,
	user *User,
	show bool,
) error {
	_, err := db.Exec(
		"UPDATE rooms SET show_cards = ? WHERE token=?;",
		show,
		room.UUID,
	)

	return err
}

func SetRoomSettings(
	db *sql.DB,
	room *Room,
	name string,
	cards string,
) error {
	_, err := db.Exec(
		"UPDATE rooms SET name = ?, cards = ? WHERE token=?;",
		name,
		cards,
		room.UUID,
	)

	return err
}
