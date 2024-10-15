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

  // If the token doesn't match with that of a user, remove the token.
  if (usersWithToken.length !== 1) {
    setCookie(event, "auth-token", "", {
      expires: new Date(0),
    })

    return
  }

  const user = usersWithToken[0]

  if (!user.id) return

  const newToken = randomBytes(64).toString("hex")

  await db
    .update(users)
    .set({
      token: newToken,
      lastActive: new Date(),
    })
    .where(eq(users.id, user.id))

  const config = useRuntimeConfig()

  setCookie(event, "auth-token", newToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 864e5),
    path: "/",
    secure: config.public.https,
    sameSite: "lax",
  })

  event.context.authToken = newToken
})
