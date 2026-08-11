import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getServerEnv } from "@/config/server-env";

let client: NeonQueryFunction<false, false> | undefined;

export function getDb() {
  client ??= neon(getServerEnv().DATABASE_URL);
  return client;
}
