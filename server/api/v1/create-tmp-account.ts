import { useDatabase } from "~/composables/useDatabase"
import { users } from "~/db/schema"

export default defineEventHandler(async (event) => {
  const { db } = useDatabase()
  const body = await readBody(event)
  const name = body.name

  if (!name) return

  await db.insert(users).values({
    name: name as string,
    token: "test",
    createdAt: new Date(),
    lastActive: new Date(),
  })

  return {
    hello: name,
  }
})
