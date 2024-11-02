package database

import "database/sql"

type User struct {
	ID         uint32
	Name       string
	Token      string
	Room       sql.NullInt32
	CreatedAt  uint32
	LastActive uint32
}

type Room struct {
	ID          uint32
	UUID        string
	Owner       uint32
	Admins      []uint32
	CreatedAt   uint32
	ShowCards   bool
	Cards       string
	Name        string
	AllowShow   bool
	AllowDelete bool
}
