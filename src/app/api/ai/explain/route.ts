import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/server-env";
import { findCachedExplanation, saveCachedExplanation } from "@/features/terms/repository";
import { generateTermExplanation } from "@/lib/ai/gemini";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { explainRequestSchema } from "@/lib/ai/schemas";

export async function POST(request: Request) {
  try {
    const input = explainRequestSchema.parse(await request.json());
    const env = getServerEnv();
    const contextHash = createHash("sha256").update(input.surroundingContext).digest("hex");
    const key = { term: input.term, articleId: input.articleId, contextHash, model: env.GEMINI_MODEL, promptVersion: PROMPT_VERSION };
    const cached = await findCachedExplanation(key);
    if (cached) return NextResponse.json({ explanation: cached, cached: true });

    const explanation = await generateTermExplanation(input);
    await saveCachedExplanation(key, explanation);
    return NextResponse.json({ explanation, cached: false });
  } catch (error) {
    console.error("Term explanation failed", error);
    return NextResponse.json({ error: "用語の解説を生成できませんでした。しばらくしてから再度お試しください。" }, { status: 400 });
  }
}
