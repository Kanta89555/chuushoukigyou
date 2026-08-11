import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/server-env";
import { getCurrentUsername } from "@/features/auth/session";
import { findCachedCompanyAnalysis, saveCachedCompanyAnalysis } from "@/features/company-analysis/repository";
import { findCompanyProfile } from "@/features/company/repository";
import { generateCompanyAnalysis } from "@/lib/ai/gemini";
import { COMPANY_ANALYSIS_PROMPT_VERSION } from "@/lib/ai/prompts";
import { companyAnalysisRequestSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const input = companyAnalysisRequestSchema.parse(await request.json());
    const profile = await findCompanyProfile(username);
    const companyInformation = profile?.fields
      .map(({ label, value }) => ({ label, value: value.trim() }))
      .filter(({ value }) => value.length > 0) ?? [];
    if (!companyInformation.length) {
      return NextResponse.json({ error: "企業情報を設定してから分析してください。", needsCompanyProfile: true }, { status: 409 });
    }

    const env = getServerEnv();
    const contextHash = createHash("sha256").update(`${input.selectedContent}\n${input.surroundingContext}`).digest("hex");
    const profileHash = createHash("sha256").update(JSON.stringify(companyInformation)).digest("hex");
    const key = { username, selectedContent: input.selectedContent, articleId: input.articleId, contextHash, profileHash, model: env.GEMINI_MODEL, promptVersion: COMPANY_ANALYSIS_PROMPT_VERSION };
    const cached = await findCachedCompanyAnalysis(key);
    if (cached) return NextResponse.json({ analysis: cached, cached: true });

    const analysis = await generateCompanyAnalysis({ ...input, companyInformation });
    await saveCachedCompanyAnalysis(key, analysis);
    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    console.error("Company analysis failed", error);
    return NextResponse.json({ error: "企業分析を生成できませんでした。しばらくしてから再度お試しください。" }, { status: 400 });
  }
}
