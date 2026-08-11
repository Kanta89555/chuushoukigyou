import { z } from "zod";

export const companyFieldSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1, "項目名を入力してください。").max(50),
  value: z.string().trim().max(1000),
});

export const companyProfileSchema = z.object({
  fields: z.array(companyFieldSchema).max(20),
});

export type CompanyField = z.infer<typeof companyFieldSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

export const DEFAULT_COMPANY_FIELDS: CompanyField[] = [
  { id: "d07eac09-70cc-4c5a-9864-45054680bf8e", label: "業種", value: "" },
  { id: "6b90a638-4606-4b8f-b1e4-c1e2b618474a", label: "主な製品・サービス", value: "" },
  { id: "a025e65d-0c93-455f-bca4-b20a3be514e4", label: "主な顧客", value: "" },
  { id: "5331b2e1-c79a-4acd-a150-e685600f67ac", label: "企業規模", value: "" },
  { id: "e1361618-8680-46b7-8112-dbb79542f938", label: "強み・保有資源", value: "" },
  { id: "f82a9309-8711-44fe-9baf-ee8443554754", label: "現在の課題", value: "" },
  { id: "a31fd00d-d945-42e1-a56a-765e19a521bd", label: "目標", value: "" },
];
