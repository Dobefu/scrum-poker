package server

import "scrumpoker/database"

type RoomSettings struct {
    ID uint32
    UUID string
    Owner uint32
    Name string
    Admins []string
    CreatedAt uint32
    ShowCards bool
    Cards string
}

type UserData struct {
	User database.User
	Estimate string
}

type RoomData struct {
	RoomSettings RoomSettings
	Users map[uint32]UserData
}
