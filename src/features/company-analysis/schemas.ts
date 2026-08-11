import { z } from "zod";
import { companyAnalysisSchema } from "@/lib/ai/schemas";

export const saveCompanyAnalysisSchema = z.object({
  selectedContent: z.string().trim().min(1).max(500),
  articleId: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  articleTitle: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(100),
  analysis: companyAnalysisSchema,
});

export const deleteSavedCompanyAnalysisSchema = z.object({
  id: z.string().uuid(),
});
