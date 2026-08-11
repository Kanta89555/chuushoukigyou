import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readArticle(articlePath: string) {
  const root = path.resolve(process.cwd(), "content", "articles");
  const resolved = path.resolve(process.cwd(), articlePath);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Invalid article path.");

  const source = await readFile(resolved, "utf8");
  return source
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/^# .+\r?\n+/, "")
    .trim();
}
