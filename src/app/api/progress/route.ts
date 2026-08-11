import { NextResponse } from "next/server";
import { getCurrentUsername } from "@/features/auth/session";
import { completeArticle } from "@/features/progress/repository";
import { completeArticleSchema } from "@/features/progress/schemas";

export async function POST(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const { articleId } = completeArticleSchema.parse(await request.json());
    await completeArticle(username, articleId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Article completion failed", error);
    return NextResponse.json({ error: "学習状況を保存できませんでした。" }, { status: 400 });
  }
}
