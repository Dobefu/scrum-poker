import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { useDatabase } from "~/composables/useDatabase"

export default defineNitroPlugin(async () => {
  if (!import.meta.dev) return

  const { db } = useDatabase()

  await migrate(db, {
    migrationsFolder: "drizzle",
  })
})
