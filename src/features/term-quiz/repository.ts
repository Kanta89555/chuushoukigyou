import "server-only";
import { getDb } from "@/lib/db";

export async function saveQuizResult(input: { username: string; termId: string; correct: boolean }) {
  const sql = getDb();
  await sql`INSERT INTO term_quiz_results (username, term_id, correct) VALUES (${input.username}, ${input.termId}, ${input.correct})`;
}
