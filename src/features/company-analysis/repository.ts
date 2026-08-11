import "server-only";

import { getDb } from "@/lib/db";
import { companyAnalysisSchema, type CompanyAnalysis } from "@/lib/ai/schemas";
import type { SavedCompanyAnalysis } from "./types";

type CompanyAnalysisCacheKey = {
  username: string;
  selectedContent: string;
  articleId: string;
  contextHash: string;
  profileHash: string;
  model: string;
  promptVersion: string;
};

export async function findCachedCompanyAnalysis(key: CompanyAnalysisCacheKey): Promise<CompanyAnalysis | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT response FROM company_analysis_cache
    WHERE username = ${key.username}
      AND selected_content = ${key.selectedContent}
      AND article_id = ${key.articleId}
      AND context_hash = ${key.contextHash}
      AND profile_hash = ${key.profileHash}
      AND model = ${key.model}
      AND prompt_version = ${key.promptVersion}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return companyAnalysisSchema.parse(JSON.parse(String(rows[0].response)));
}

export async function saveCachedCompanyAnalysis(key: CompanyAnalysisCacheKey, analysis: CompanyAnalysis): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO company_analysis_cache
      (username, selected_content, article_id, context_hash, profile_hash, model, prompt_version, response)
    VALUES
      (${key.username}, ${key.selectedContent}, ${key.articleId}, ${key.contextHash}, ${key.profileHash}, ${key.model}, ${key.promptVersion}, ${JSON.stringify(analysis)})
    ON CONFLICT (username, selected_content, article_id, context_hash, profile_hash, model, prompt_version)
    DO NOTHING
  `;
}

type SaveCompanyAnalysisInput = {
  username: string;
  selectedContent: string;
  articleId: string;
  articleTitle: string;
  subject: string;
  analysis: CompanyAnalysis;
};

export async function saveCompanyAnalysis(input: SaveCompanyAnalysisInput): Promise<SavedCompanyAnalysis> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO saved_company_analyses
      (username, selected_content, article_id, article_title, subject, analysis)
    VALUES
      (${input.username}, ${input.selectedContent}, ${input.articleId}, ${input.articleTitle}, ${input.subject}, ${JSON.stringify(input.analysis)})
    ON CONFLICT (username, article_id, selected_content)
    DO UPDATE SET
      article_title = EXCLUDED.article_title,
      subject = EXCLUDED.subject,
      analysis = EXCLUDED.analysis,
      updated_at = NOW()
    RETURNING id, selected_content, article_id, article_title, subject, analysis, created_at
  `;
  return mapSavedCompanyAnalysis(rows[0]);
}

export async function findSavedCompanyAnalyses(username: string): Promise<SavedCompanyAnalysis[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, selected_content, article_id, article_title, subject, analysis, created_at
    FROM saved_company_analyses
    WHERE username = ${username}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map(mapSavedCompanyAnalysis);
}

export async function findSavedCompanyAnalysesByArticle(username: string, articleId: string): Promise<SavedCompanyAnalysis[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, selected_content, article_id, article_title, subject, analysis, created_at
    FROM saved_company_analyses
    WHERE username = ${username} AND article_id = ${articleId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map(mapSavedCompanyAnalysis);
}

export async function deleteSavedCompanyAnalysis(id: string, username: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    DELETE FROM saved_company_analyses
    WHERE id = ${id} AND username = ${username}
    RETURNING id
  `;
  return rows.length === 1;
}

function mapSavedCompanyAnalysis(row: Record<string, unknown>): SavedCompanyAnalysis {
  return {
    id: String(row.id),
    selectedContent: String(row.selected_content),
    articleId: String(row.article_id),
    articleTitle: String(row.article_title),
    subject: String(row.subject),
    analysis: companyAnalysisSchema.parse(JSON.parse(String(row.analysis))),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}
