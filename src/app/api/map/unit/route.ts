import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUsername } from "@/features/auth/session";
import { findVocabulariesByArticle } from "@/features/vocabulary/repository";
import { findSavedCompanyAnalysesByArticle } from "@/features/company-analysis/repository";

const querySchema = z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/);

export async function GET(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const articleId = querySchema.parse(new URL(request.url).searchParams.get("articleId"));
    const [vocabularies, analyses] = await Promise.all([
      findVocabulariesByArticle(username, articleId),
      findSavedCompanyAnalysesByArticle(username, articleId),
    ]);
    return NextResponse.json({ vocabularies, analyses });
  } catch (error) {
    console.error("Learning map unit lookup failed", error);
    return NextResponse.json({ error: "保存内容を取得できませんでした。" }, { status: 400 });
  }
}
