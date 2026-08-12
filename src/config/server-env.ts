import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
});

const authEnvSchema = z.object({
  SINGLE_USER_USERNAME: z.string().trim().min(1).max(50),
  SINGLE_USER_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

export function getServerEnv() {
  return serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
}

export function getAuthEnv() {
  const development = process.env.NODE_ENV !== "production";
  return authEnvSchema.parse({
    SINGLE_USER_USERNAME: process.env.SINGLE_USER_USERNAME ?? (development ? "あ" : undefined),
    SINGLE_USER_PASSWORD: process.env.SINGLE_USER_PASSWORD ?? (development ? "あ" : undefined),
    SESSION_SECRET: process.env.SESSION_SECRET ?? (development ? "development-only-session-secret-change-me" : undefined),
  });
}
