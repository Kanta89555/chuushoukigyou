import { NextResponse } from "next/server";
import { getCurrentUsername } from "@/features/auth/session";
import {
  deleteSavedCompanyAnalysis,
  findSavedCompanyAnalyses,
  saveCompanyAnalysis,
} from "@/features/company-analysis/repository";
import {
  deleteSavedCompanyAnalysisSchema,
  saveCompanyAnalysisSchema,
} from "@/features/company-analysis/schemas";

export async function GET() {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    return NextResponse.json({ items: await findSavedCompanyAnalyses(username) });
  } catch (error) {
    console.error("Company analysis lookup failed", error);
    return NextResponse.json({ error: "保存した企業分析を取得できませんでした。" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const input = saveCompanyAnalysisSchema.parse(await request.json());
    return NextResponse.json({ item: await saveCompanyAnalysis({ ...input, username }) });
  } catch (error) {
    console.error("Company analysis save failed", error);
    return NextResponse.json({ error: "企業分析を保存できませんでした。" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const { id } = deleteSavedCompanyAnalysisSchema.parse(await request.json());
    const deleted = await deleteSavedCompanyAnalysis(id, username);
    if (!deleted) return NextResponse.json({ error: "企業分析が見つかりません。" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company analysis delete failed", error);
    return NextResponse.json({ error: "企業分析を削除できませんでした。" }, { status: 400 });
  }
}
