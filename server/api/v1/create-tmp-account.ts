import { randomBytes } from "node:crypto"
import { useDatabase } from "~/composables/useDatabase"
import { users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)

  const name = body.name
  const hash = randomBytes(64).toString("hex")

  if (!name) return

  await db.insert(users).values({
    name: name as string,
    token: hash,
    createdAt: new Date(),
    lastActive: new Date(),
  })

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
