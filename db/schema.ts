import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  token: text("token").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastActive: integer("created_at", { mode: "timestamp" }).notNull(),
})
