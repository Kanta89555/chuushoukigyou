import "server-only";

import { getDb } from "@/lib/db";

export async function userExists(username: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`SELECT username FROM users WHERE username = ${username} LIMIT 1`;
  return rows.length === 1;
}
