import "server-only";

import { getDb } from "@/lib/db";
import { companyAnalysisSchema, type CompanyAnalysis } from "@/lib/ai/schemas";

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
