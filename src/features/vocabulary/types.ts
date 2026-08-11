import type { TermExplanation } from "@/lib/ai/schemas";

export type VocabularyItem = {
  id: string;
  term: string;
  explanation: TermExplanation;
  articleId: string;
  createdAt: string;
};
