import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.6-flash"),
});

const authEnvSchema = z.object({
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
    SESSION_SECRET: process.env.SESSION_SECRET ?? (development ? "development-only-session-secret-change-me" : undefined),
  });
}
