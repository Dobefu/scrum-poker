import Database from "bun:sqlite"
import { eq, lt } from "drizzle-orm"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { rooms, users } from "~/db/schema"

const db = drizzle(new Database("./db/db.sqlite"))

const expiredUsers = await db
  .select()
  .from(users)
  .where(lt(users.lastActive, new Date(Math.floor(Date.now()) - 864e5)))
  .execute()

for (let user of expiredUsers) {
  await db.delete(users).where(eq(users.id, user.id)).execute()
}

const orphanedRooms = await db
  .select({
    userId: users.id,
    roomId: rooms.id,
    owner: rooms.owner,
  })
  .from(rooms)
  .leftJoin(users, eq(users.id, rooms.owner))
  .execute()

for (let room of orphanedRooms) {
  if (!!room.userId && room.userId && room.owner) continue

  await db.delete(rooms).where(eq(rooms.id, room.roomId)).execute()
}
