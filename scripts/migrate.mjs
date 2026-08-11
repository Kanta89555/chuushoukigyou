import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local before running migrations.");
}

const sql = neon(process.env.DATABASE_URL);
await sql.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const migrationsDirectory = new URL("../migrations/", import.meta.url);
const files = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();

for (const name of files) {
  const applied = await sql`SELECT name FROM schema_migrations WHERE name = ${name}`;
  if (applied.length) continue;

  const migration = await readFile(new URL(name, migrationsDirectory), "utf8");
  for (const statement of migration.split(/;\s*(?:\r?\n|$)/).map((value) => value.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
  await sql`INSERT INTO schema_migrations (name) VALUES (${name})`;
  console.log(`Applied ${name}`);
}

console.log("Database migration completed.");
