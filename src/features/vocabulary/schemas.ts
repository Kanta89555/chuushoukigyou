import { z } from "zod";
import { termExplanationSchema } from "@/lib/ai/schemas";

export const ownerIdSchema = z.string().uuid();

export const saveVocabularySchema = z.object({
  ownerId: ownerIdSchema,
  term: z.string().trim().min(1).max(100),
  articleId: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  explanation: termExplanationSchema,
});
