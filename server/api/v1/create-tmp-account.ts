import { eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"
import { useDatabase } from "~/composables/useDatabase"
import { rooms, users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  const name = body.name
  if (!name) return

  const withRoom = body.withRoom ?? false
  const hash = randomBytes(64).toString("hex")

  let roomId = undefined
  let roomUuid = randomBytes(16).toString("hex")

  if (withRoom) {
    roomUuid = randomBytes(16).toString("hex")

    const newRoom = await db
      .insert(rooms)
      .values({
        uuid: roomUuid,
        admins: [],
        createdAt: new Date(),
      })
      .returning()

    roomId = newRoom[0].id
  }

  const newUser = await db
    .insert(users)
    .values({
      name: name as string,
      token: hash,
      createdAt: new Date(),
      lastActive: new Date(),
      room: roomId,
    })
    .returning()

  if (withRoom) {
    await db
      .update(rooms)
      .set({
        owner: newUser[0].id,
        admins: [newUser[0].id],
      })
      .where(eq(rooms.uuid, roomUuid))
  }

  setCookie(event, "auth-token", hash, {
    httpOnly: true,
    expires: new Date(Date.now() + 864e5),
    path: "/",
    sameSite: "lax",
  })

  return {
    success: true,
  }
})
