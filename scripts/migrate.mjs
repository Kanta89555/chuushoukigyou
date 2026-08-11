import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local before running migrations.");
}

const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(
  new URL("../migrations/0001_create_ai_explanations_and_vocabularies.sql", import.meta.url),
  "utf8",
);

for (const statement of migration.split(/;\s*(?:\r?\n|$)/).map((value) => value.trim()).filter(Boolean)) {
  await sql.query(statement);
}

console.log("Database migration completed.");
