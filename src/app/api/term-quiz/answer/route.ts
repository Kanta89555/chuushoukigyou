import { NextResponse } from "next/server";
import { getCurrentUsername } from "@/features/auth/session";
import { getTermById } from "@/features/term-quiz/dictionary";
import { saveQuizResult } from "@/features/term-quiz/repository";
import { answerTermQuizSchema } from "@/features/term-quiz/schemas";

export async function POST(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const input = answerTermQuizSchema.parse(await request.json());
    const term = getTermById(input.termId);
    const choice = getTermById(input.choiceId);
    if (!term || !choice) return NextResponse.json({ error: "問題が見つかりません。" }, { status: 404 });
    const correct = input.termId === input.choiceId;
    await saveQuizResult({ username, termId: input.termId, correct });
    return NextResponse.json({ correct, correctChoiceId: input.termId, explanation: term.definition });
  } catch (error) {
    console.error("Term quiz answer failed", error);
    return NextResponse.json({ error: "回答を保存できませんでした。" }, { status: 400 });
  }
}
