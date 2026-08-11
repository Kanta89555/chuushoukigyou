import { NextResponse } from "next/server";
import { getCurrentUsername } from "@/features/auth/session";
import { findCompanyProfile, saveCompanyProfile } from "@/features/company/repository";
import { companyProfileSchema, DEFAULT_COMPANY_FIELDS } from "@/features/company/schemas";

export async function GET() {
  const username = await getCurrentUsername();
  if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const profile = await findCompanyProfile(username);
  return NextResponse.json({ profile: profile ?? { fields: DEFAULT_COMPANY_FIELDS } });
}

export async function PUT(request: Request) {
  try {
    const username = await getCurrentUsername();
    if (!username) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const profile = companyProfileSchema.parse(await request.json());
    return NextResponse.json({ profile: await saveCompanyProfile(username, profile) });
  } catch (error) {
    console.error("Company profile save failed", error);
    return NextResponse.json({ error: "企業情報を保存できませんでした。入力内容を確認してください。" }, { status: 400 });
  }
}
