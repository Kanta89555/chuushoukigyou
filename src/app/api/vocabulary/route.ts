import { NextResponse } from "next/server";
import { findVocabularies, saveVocabulary } from "@/features/vocabulary/repository";
import { ownerIdSchema, saveVocabularySchema } from "@/features/vocabulary/schemas";

export async function GET(request: Request) {
  try {
    const ownerId = ownerIdSchema.parse(new URL(request.url).searchParams.get("ownerId"));
    return NextResponse.json({ items: await findVocabularies(ownerId) });
  } catch (error) {
    console.error("Vocabulary lookup failed", error);
    return NextResponse.json({ error: "単語帳を取得できませんでした。" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const input = saveVocabularySchema.parse(await request.json());
    return NextResponse.json({ item: await saveVocabulary(input) });
  } catch (error) {
    console.error("Vocabulary save failed", error);
    return NextResponse.json({ error: "単語帳へ保存できませんでした。" }, { status: 400 });
  }
}
