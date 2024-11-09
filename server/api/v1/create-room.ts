import { eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  const token = body.token
  if (!token) return { success: false }

  const usersWithToken = await db
    .select()
    .from(users)
    .where(eq(users.token, token))
    .execute()

  if (usersWithToken.length !== 1) return { success: false }

  const user = usersWithToken[0]

  if (!user.id) return { success: false }

  const userRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.owner, user.id))
    .execute()

  if (userRooms.length !== 0) return { success: false }

  const roomUuid = randomBytes(16).toString("hex")

  await db
    .insert(rooms)
    .values({
      uuid: roomUuid,
      owner: user.id,
      admins: [user.id],
      createdAt: new Date(),
      spectators: [],
    })
    .returning()

  return {
    success: true,
    room: roomUuid,
  }
})
