import "server-only";

import { getDb } from "@/lib/db";
import { companyProfileSchema, type CompanyProfile } from "./schemas";

export async function findCompanyProfile(username: string): Promise<CompanyProfile | null> {
  const sql = getDb();
  const rows = await sql`SELECT fields FROM company_profiles WHERE username = ${username} LIMIT 1`;
  if (!rows[0]) return null;
  const fields = typeof rows[0].fields === "string" ? JSON.parse(rows[0].fields) : rows[0].fields;
  return companyProfileSchema.parse({ fields });
}

export async function saveCompanyProfile(username: string, profile: CompanyProfile): Promise<CompanyProfile> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO company_profiles (username, fields)
    VALUES (${username}, ${JSON.stringify(profile.fields)}::jsonb)
    ON CONFLICT (username)
    DO UPDATE SET fields = EXCLUDED.fields, updated_at = NOW()
    RETURNING fields
  `;
  const fields = typeof rows[0].fields === "string" ? JSON.parse(rows[0].fields) : rows[0].fields;
  return companyProfileSchema.parse({ fields });
}
