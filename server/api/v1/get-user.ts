import { eq } from "drizzle-orm"
import { useDatabase } from "~/composables/useDatabase"
import { users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  if (!body?.token) {
    return { success: false }
  }

  const token = body.token

  if (!token) {
    return { success: false }
  }

  const usersWithToken = await db
    .select()
    .from(users)
    .where(eq(users.token, token))
    .execute()

  if (usersWithToken.length !== 1) {
    return { success: false }
  }

  const user = usersWithToken[0]

  if (!user.id) {
    return { success: false }
  }

  return {
    success: true,
    user,
  }
})
