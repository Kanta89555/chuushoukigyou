import { z } from "zod";

export const termExplanationSchema = z.object({
  definition: z.string().min(1).max(500),
  details: z.string().min(1).max(2000),
  example: z.string().min(1).max(1000),
  relatedTerms: z.array(z.string().min(1).max(80)).max(6),
  examPoint: z.string().min(1).max(1000),
});

export type TermExplanation = z.infer<typeof termExplanationSchema>;

export const explainRequestSchema = z.object({
  term: z.string().trim().min(1).max(100),
  articleId: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  articleTitle: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(100),
  surroundingContext: z.string().trim().min(1).max(1500),
});
