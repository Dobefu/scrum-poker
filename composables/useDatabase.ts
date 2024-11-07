import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "../db/schema"

export const tables = schema

export function useDatabase() {
  const db = drizzle(new Database("./db/db.sqlite"))

  return {
    db,
  }
}
