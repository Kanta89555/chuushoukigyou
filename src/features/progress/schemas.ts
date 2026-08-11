import { z } from "zod";

export const completeArticleSchema = z.object({
  articleId: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
});
