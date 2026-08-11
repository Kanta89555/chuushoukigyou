import "server-only";

import { getDb } from "@/lib/db";
import type { UnitMapState } from "./map-types";

export async function findUnitMapStates(username: string): Promise<Record<string, UnitMapState>> {
  const sql = getDb();
  const rows = await sql`
    WITH article_ids AS (
      SELECT article_id FROM article_progress WHERE username = ${username}
      UNION SELECT article_id FROM vocabularies WHERE username = ${username}
      UNION SELECT article_id FROM saved_company_analyses WHERE username = ${username}
    )
    SELECT
      ids.article_id,
      EXISTS (
        SELECT 1 FROM article_progress progress
        WHERE progress.username = ${username} AND progress.article_id = ids.article_id
      ) AS completed,
      (SELECT COUNT(*) FROM vocabularies vocabulary WHERE vocabulary.username = ${username} AND vocabulary.article_id = ids.article_id) AS vocabulary_count,
      (SELECT COUNT(*) FROM saved_company_analyses analysis WHERE analysis.username = ${username} AND analysis.article_id = ids.article_id) AS analysis_count,
      COALESCE((SELECT string_agg(vocabulary.term, ' ') FROM vocabularies vocabulary WHERE vocabulary.username = ${username} AND vocabulary.article_id = ids.article_id), '') || ' ' ||
      COALESCE((SELECT string_agg(analysis.selected_content, ' ') FROM saved_company_analyses analysis WHERE analysis.username = ${username} AND analysis.article_id = ids.article_id), '') AS search_text
    FROM article_ids ids
  `;
  return Object.fromEntries(rows.map((row) => [String(row.article_id), {
    completed: Boolean(row.completed),
    vocabularyCount: Number(row.vocabulary_count),
    analysisCount: Number(row.analysis_count),
    searchText: String(row.search_text),
  }]));
}
