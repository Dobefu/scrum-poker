import { eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"
import { useDatabase } from "~/composables/useDatabase"
import { users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  if (event.node.req.url?.startsWith("/api")) return
  if (event.node.req.url?.startsWith("/_")) return

  const token = getCookie(event, "auth-token")
  if (!token) return

  const { db } = useDatabase()

  const usersWithToken = await db
    .select()
    .from(users)
    .where(eq(users.token, token))
    .execute()

  if (usersWithToken.length !== 1) return

  const user = usersWithToken[0]

  if (!user.id) return

  const newToken = randomBytes(64).toString("hex")

  await db
    .update(users)
    .set({
      token: newToken,
    })
    .where(eq(users.id, user.id))

  setCookie(event, "auth-token", newToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 864e5),
    path: "/",
    sameSite: "lax",
  })

  event.context.authToken = newToken
})
