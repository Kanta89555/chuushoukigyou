import { NextResponse } from "next/server";
import { createSession } from "@/features/auth/session";
import { userExists } from "@/features/auth/repository";
import { loginSchema } from "@/features/auth/schemas";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ユーザー名を入力してください。" }, { status: 400 });
  }
  if (!(await userExists(parsed.data.username))) {
    return NextResponse.json({ error: "登録されていないユーザー名です。" }, { status: 401 });
  }
  await createSession(parsed.data.username);
  return NextResponse.json({ username: parsed.data.username });
}
