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
	rows, err := db.Query(
		"SELECT id FROM users WHERE token=?;",
		token,
	)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	for rows.Next() {
		user := User{}

		err = rows.Scan(&user.ID)

		return &user, err
	}

	return nil, nil
}
