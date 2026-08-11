import "server-only";

import { getDb } from "@/lib/db";
import { termExplanationSchema, type TermExplanation } from "@/lib/ai/schemas";
import type { VocabularyItem } from "./types";

type SaveInput = {
  username: string;
  term: string;
  articleId: string;
  explanation: TermExplanation;
};

export async function saveVocabulary(input: SaveInput): Promise<VocabularyItem> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO vocabularies (username, term, explanation, article_id)
    VALUES (${input.username}, ${input.term}, ${JSON.stringify(input.explanation)}, ${input.articleId})
    ON CONFLICT (username, article_id, term)
    DO UPDATE SET explanation = EXCLUDED.explanation, updated_at = NOW()
    RETURNING id, term, explanation, article_id, created_at
  `;
  return mapVocabulary(rows[0]);
}

export async function findVocabularies(username: string): Promise<VocabularyItem[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, term, explanation, article_id, created_at
    FROM vocabularies
    WHERE username = ${username}
    ORDER BY updated_at DESC
    LIMIT 200
  `;
  return rows.map(mapVocabulary);
}

export async function findVocabulariesByArticle(username: string, articleId: string): Promise<VocabularyItem[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, term, explanation, article_id, created_at
    FROM vocabularies
    WHERE username = ${username} AND article_id = ${articleId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map(mapVocabulary);
}

export async function deleteVocabulary(id: string, username: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    DELETE FROM vocabularies
    WHERE id = ${id} AND username = ${username}
    RETURNING id
  `;
  return rows.length === 1;
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
