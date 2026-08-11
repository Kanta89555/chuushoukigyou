import type { z } from "zod";
import type { explainRequestSchema } from "./schemas";

export const PROMPT_VERSION = "term-explanation-v1";

type ExplainInput = z.infer<typeof explainRequestSchema>;

export function buildTermExplanationPrompt(input: ExplainInput) {
  return `あなたは中小企業診断士試験の初学者を支援する講師です。
次の専門用語を、周辺文章における意味を優先して日本語で説明してください。
断定できない年度依存情報は推測せず、試験で区別すべき点を明確にしてください。

科目: ${input.subject}
記事: ${input.articleTitle}
用語: ${input.term}
周辺文章: ${input.surroundingContext}`;
}
