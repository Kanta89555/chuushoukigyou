import "server-only";

import { getDb } from "@/lib/db";
import { termExplanationSchema, type TermExplanation } from "@/lib/ai/schemas";
import type { VocabularyItem } from "./types";

type SaveInput = {
  ownerId: string;
  term: string;
  articleId: string;
  explanation: TermExplanation;
};

export async function saveVocabulary(input: SaveInput): Promise<VocabularyItem> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO vocabularies (user_id, term, explanation, article_id)
    VALUES (${input.ownerId}, ${input.term}, ${JSON.stringify(input.explanation)}, ${input.articleId})
    ON CONFLICT (user_id, article_id, term)
    DO UPDATE SET explanation = EXCLUDED.explanation, updated_at = NOW()
    RETURNING id, term, explanation, article_id, created_at
  `;
  return mapVocabulary(rows[0]);
}

export async function findVocabularies(ownerId: string): Promise<VocabularyItem[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, term, explanation, article_id, created_at
    FROM vocabularies
    WHERE user_id = ${ownerId}
    ORDER BY updated_at DESC
    LIMIT 200
  `;
  return rows.map(mapVocabulary);
}

function mapVocabulary(row: Record<string, unknown>): VocabularyItem {
  const explanation = termExplanationSchema.parse(JSON.parse(String(row.explanation)));
  return {
    id: String(row.id),
    term: String(row.term),
    explanation,
    articleId: String(row.article_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}
