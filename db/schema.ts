import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  token: text("token").notNull(),
  room: integer("room"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastActive: integer("last_active", { mode: "timestamp" }).notNull(),
})

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uuid: text("token").notNull(),
  owner: integer("owner"),
  admins: blob("admins", { mode: "json" }).$type<number[]>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

  showCards: integer("show_cards", { mode: "boolean" }).default(false),
  cards: text("cards").default("?,∞,0,1,2,3,5,8,13,20,40,100").notNull(),
  name: text("name").default("Poker Room").notNull(),
  allowShow: integer("allow_show", { mode: "boolean" }).default(false),
  allowDelete: integer("allow_delete", { mode: "boolean" }).default(false),
  spectators: blob("spectators", { mode: "json" }).$type<number[]>().notNull(),
})
