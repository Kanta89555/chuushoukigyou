import type { CompanyAnalysis } from "@/lib/ai/schemas";

export type SavedCompanyAnalysis = {
  id: string;
  selectedContent: string;
  articleId: string;
  articleTitle: string;
  subject: string;
  analysis: CompanyAnalysis;
  createdAt: string;
};
