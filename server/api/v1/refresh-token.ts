import { eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"
import { useDatabase } from "~/composables/useDatabase"
import { users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  const token = body.token
  if (!token) return

  const usersWithToken = await db
    .select()
    .from(users)
    .where(eq(users.token, token))
    .execute()

  if (usersWithToken.length !== 1) return

  const user = usersWithToken[0]

  const newToken = randomBytes(64).toString("hex")

  await db
    .update(users)
    .set({
      token: newToken,
    })
    .where(eq(users.id, user.id))

  return {
    success: true,
    token: newToken,
  }
})
