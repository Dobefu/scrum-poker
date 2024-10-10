import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  if (!body?.token) return false

  const token = body.token
  if (!token) return false

  const room = await db
    .select()
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.owner))
    .where(eq(users.token, token))

  if (room.length !== 1) return false

  return room[0].rooms
})
