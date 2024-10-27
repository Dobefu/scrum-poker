package server

import (
	"scrumpoker/database"

	"github.com/gorilla/websocket"
)

type RoomSettings struct {
	ID        uint32
	UUID      string
	Owner     uint32
	Name      string
	Admins    []uint32
	CreatedAt uint32
	ShowCards bool
	Cards     string
}

type UserData struct {
	User     database.User
	Conn     *websocket.Conn
	Estimate string
}

type RoomData struct {
	RoomSettings RoomSettings
	Users        map[uint32]UserData
}
