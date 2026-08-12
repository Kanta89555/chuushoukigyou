import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthEnv } from "@/config/server-env";
import { userExists } from "./repository";

const SESSION_COOKIE = "smec-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const SINGLE_USER_USERNAME = "あ";

type SessionPayload = { username: string; expiresAt: number };

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createToken(username: string): string {
  const { SESSION_SECRET } = getAuthEnv();
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  } satisfies SessionPayload)).toString("base64url");
  return `${payload}.${sign(payload, SESSION_SECRET)}`;
}

function verifyToken(token: string): SessionPayload | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expected = sign(payload, getAuthEnv().SESSION_SECRET);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (typeof parsed.username !== "string" || typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) return null;
    return { username: parsed.username, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export const getCurrentUsername = cache(async (): Promise<string | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifyToken(token);
  if (!session || session.username !== SINGLE_USER_USERNAME || !(await userExists(session.username))) return null;
  return session.username;
});

export async function requireCurrentUsername(): Promise<string> {
  const username = await getCurrentUsername();
  if (!username) redirect("/login");
  return username;
}

export async function createSession(username: string) {
  (await cookies()).set(SESSION_COOKIE, createToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession() {
  (await cookies()).set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
