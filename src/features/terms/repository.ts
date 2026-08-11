import "server-only";

import { getDb } from "@/lib/db";
import { termExplanationSchema, type TermExplanation } from "@/lib/ai/schemas";

type CacheKey = {
  term: string;
  articleId: string;
  contextHash: string;
  model: string;
  promptVersion: string;
};

export async function findCachedExplanation(key: CacheKey): Promise<TermExplanation | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT response
    FROM ai_explanation_cache
    WHERE term = ${key.term}
      AND article_id = ${key.articleId}
      AND context_hash = ${key.contextHash}
      AND model = ${key.model}
      AND prompt_version = ${key.promptVersion}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return termExplanationSchema.parse(JSON.parse(String(rows[0].response)));
}

export async function saveCachedExplanation(key: CacheKey, explanation: TermExplanation) {
  const sql = getDb();
  await sql`
    INSERT INTO ai_explanation_cache
      (term, article_id, context_hash, model, prompt_version, response)
    VALUES
      (${key.term}, ${key.articleId}, ${key.contextHash}, ${key.model}, ${key.promptVersion}, ${JSON.stringify(explanation)})
    ON CONFLICT (term, article_id, context_hash, model, prompt_version)
    DO NOTHING
  `;
}
