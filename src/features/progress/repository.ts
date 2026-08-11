import "server-only";

import { getDb } from "@/lib/db";

export async function completeArticle(username: string, articleId: string): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO article_progress (username, article_id)
    VALUES (${username}, ${articleId})
    ON CONFLICT (username, article_id)
    DO UPDATE SET completed_at = NOW()
  `;
}

export async function findCompletedArticleIds(username: string): Promise<string[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT article_id
    FROM article_progress
    WHERE username = ${username}
    ORDER BY completed_at DESC
  `;
  return rows.map((row) => String(row.article_id));
}
