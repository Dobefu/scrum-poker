export type UserData = {
  RoomSettings?: {
    Admins?: number[]
    Cards: string
    CreatedAt: number
    ID: number
    Name: string
    Owner: number
    ShowCards: boolean
    UUID: string
  }
  Users?: Record<string, UserDataUser>
}

export type UserDataUser = {
  User: {
    ID: number
    Name: string
    Room: number
    CreatedAt: number
    LastActive: number
  }
  Estimate: string
}
