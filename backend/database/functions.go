package database

import (
	"database/sql"
	"encoding/json"
)

func GetRoomDataByUuid(db *sql.DB, uuid string) (*Room, error) {
	room := Room{}
	var admins []uint8
	var spectators []uint8

	err := db.QueryRow(
		"SELECT id, token, owner, admins, cards, show_cards, name, allow_show, allow_delete, spectators FROM rooms WHERE token=?;",
		uuid,
	).Scan(&room.ID, &room.UUID, &room.Owner, &admins, &room.Cards, &room.ShowCards, &room.Name, &room.AllowShow, &room.AllowDelete, &spectators)

	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(admins, &room.Admins)

	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(spectators, &room.Spectators)

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
	allowShow bool,
	allowDelete bool,
) error {
	_, err := db.Exec(
		"UPDATE rooms SET name = ?, cards = ?, allow_show = ?, allow_delete = ? WHERE token=?;",
		name,
		cards,
		allowShow,
		allowDelete,
		room.UUID,
	)

	return err
}
