import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  if (!body?.token) return false

  const token = body.token
  if (!token) return false

  const usersWithToken = await db
    .select({
      id: users.id,
      name: users.name,
      token: users.token,
    })
    .from(users)
    .where(eq(users.token, token))
    .execute()

  if (usersWithToken.length !== 1) return false

  const user = usersWithToken[0]

  if (!user.id) return false

  return user
})
