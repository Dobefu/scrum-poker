import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { rooms } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  if (!body?.roomUuid) return false

  const roomUuid = body.roomUuid
  if (!roomUuid) return false

  const room = await db.select().from(rooms).where(eq(rooms.uuid, roomUuid))

  if (room.length !== 1) return false

  return room[0]
})
