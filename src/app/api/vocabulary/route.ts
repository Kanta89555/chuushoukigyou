import { NextResponse } from "next/server";
import { getCurrentUsername } from "@/features/auth/session";
import { deleteVocabulary, findVocabularies, saveVocabulary } from "@/features/vocabulary/repository";
import { deleteVocabularySchema, saveVocabularySchema } from "@/features/vocabulary/schemas";

export async function GET() {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    return NextResponse.json({ items: await findVocabularies(username) });
  } catch (error) {
    console.error("Vocabulary lookup failed", error);
    return NextResponse.json({ error: "単語帳を取得できませんでした。" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const input = saveVocabularySchema.parse(await request.json());
    return NextResponse.json({ item: await saveVocabulary({ ...input, username }) });
  } catch (error) {
    console.error("Vocabulary save failed", error);
    return NextResponse.json({ error: "単語帳へ保存できませんでした。" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const { id } = deleteVocabularySchema.parse(await request.json());
    const deleted = await deleteVocabulary(id, username);
    if (!deleted) return NextResponse.json({ error: "単語が見つかりません。" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vocabulary delete failed", error);
    return NextResponse.json({ error: "単語を削除できませんでした。" }, { status: 400 });
  }
}
