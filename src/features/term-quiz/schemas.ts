import { z } from "zod";

export const answerTermQuizSchema = z.object({
  termId: z.string().trim().min(1).max(150).regex(/^[a-z0-9-]+$/),
  choiceId: z.string().trim().min(1).max(150).regex(/^[a-z0-9-]+$/),
});
