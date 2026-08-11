import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { userExists } from "./repository";
import { usernameSchema } from "./schemas";

const SESSION_COOKIE = "smec-username";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const getCurrentUsername = cache(async (): Promise<string | null> => {
  const rawUsername = (await cookies()).get(SESSION_COOKIE)?.value;
  const parsed = usernameSchema.safeParse(rawUsername);
  if (!parsed.success || !(await userExists(parsed.data))) return null;
  return parsed.data;
});

export async function requireCurrentUsername(): Promise<string> {
  const username = await getCurrentUsername();
  if (!username) redirect("/login");
  return username;
}

export async function createSession(username: string) {
  (await cookies()).set(SESSION_COOKIE, username, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
