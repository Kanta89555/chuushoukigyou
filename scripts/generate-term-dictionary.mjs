import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const curriculum = JSON.parse(await readFile(path.join(root, "content/curriculum/smec.json"), "utf8"));
const entries = [];

function clean(value) {
  return value.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
}

function titleTerms(title) {
  const terms = new Set([clean(title)]);
  const base = clean(title.replace(/[（(][^）)]*[）)]/g, ""));
  if (base.length >= 2) terms.add(base);
  for (const match of title.matchAll(/[（(]([^）)]+)[）)]/g)) {
    for (const part of match[1].split(/[・、／/]/)) {
      const term = clean(part.replace(/^(?:等|など)$/, ""));
      if (term.length >= 2) terms.add(term);
    }
  }
  for (const match of title.matchAll(/[A-Za-z][A-Za-z0-9+./-]{1,15}/g)) terms.add(match[0]);
  return [...terms].filter((term) => term.length <= 80);
}

function abbreviationTerms(markdown) {
  const terms = new Set();
  const plain = markdown.replace(/```[\s\S]*?```/g, "");
  for (const match of plain.matchAll(/([A-Za-z][A-Za-z0-9+./-]{1,15})[（(]([^）)\n]{2,80})[）)]/g)) {
    terms.add(clean(match[1]));
    terms.add(clean(match[2]));
  }
  for (const match of plain.matchAll(/([^\s、。！？|#]{2,30})[（(]([A-Z][A-Z0-9+./-]{1,15})[）)]/g)) {
    terms.add(clean(match[1]));
    terms.add(clean(match[2]));
  }
  return [...terms].filter((term) => term.length >= 2 && term.length <= 80);
}

function firstExplanation(markdown, fallback) {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").replace(/^# .+\r?\n+/, "");
  const paragraphs = body.split(/\r?\n\s*\r?\n/).map(clean).filter((text) => text && !text.startsWith("#") && !text.startsWith("|") && !text.startsWith("```"));
  const text = paragraphs.find((paragraph) => paragraph.length >= 30) ?? `${fallback}についての重要な考え方です。`;
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

async function walk(node, subjectId = "", categoryId = "") {
  const nextSubject = node.type === "subject" ? node.id : subjectId;
  const nextCategory = node.type === "category" ? node.id : categoryId;
  if (node.type === "unit" && node.article) {
    const markdown = await readFile(path.join(root, node.article), "utf8");
    const terms = [...new Set([...titleTerms(node.title), ...abbreviationTerms(markdown)])];
    const definition = firstExplanation(markdown, node.title);
    for (const [index, term] of terms.entries()) {
      entries.push({
        id: `${node.id}-${index + 1}`,
        term,
        articleId: node.id,
        subjectId: nextSubject,
        categoryId: nextCategory,
        definition,
      });
    }
  }
  for (const child of node.children ?? []) await walk(child, nextSubject, nextCategory);
}

await walk(curriculum);
await mkdir(path.join(root, "content/terms"), { recursive: true });
await writeFile(path.join(root, "content/terms/smec-terms.json"), `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Generated ${entries.length} term entries.`);
