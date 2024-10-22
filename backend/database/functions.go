package database

import "database/sql"

func GetRoomDataByUuid(db *sql.DB, uuid string) (*Room, error) {
	rows, err := db.Query(
		"SELECT id FROM rooms WHERE token=?;",
		uuid,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		room := Room{}

		err = rows.Scan(&room.ID)

		return &room, err
	}

	return nil, nil
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

	return &user, err
}
