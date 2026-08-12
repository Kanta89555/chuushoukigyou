import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthEnv } from "@/config/server-env";
import { createSession } from "@/features/auth/session";
import { userExists } from "@/features/auth/repository";
import { loginSchema } from "@/features/auth/schemas";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "合言葉を入力してください。" }, { status: 400 });
  }
  const { SINGLE_USER_PASSWORD, SINGLE_USER_USERNAME } = getAuthEnv();
  const actual = Buffer.from(parsed.data.password);
  const expected = Buffer.from(SINGLE_USER_PASSWORD);
  const validPassword = actual.length === expected.length && timingSafeEqual(actual, expected);
  if (!validPassword || !(await userExists(SINGLE_USER_USERNAME))) {
    return NextResponse.json({ error: "合言葉が正しくありません。" }, { status: 401 });
  }
  await createSession(SINGLE_USER_USERNAME);
  return NextResponse.json({ success: true });
}
