import { z } from "zod";

export const usernameSchema = z.string().trim().min(1, "ユーザー名を入力してください。").max(50);

export const loginSchema = z.object({
  password: z.string().min(1, "合言葉を入力してください。").max(200),
});
