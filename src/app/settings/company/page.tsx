import Link from "next/link";
import { requireCurrentUsername } from "@/features/auth/session";
import { CompanyProfileForm } from "@/features/company/components/CompanyProfileForm";
import { findCompanyProfile } from "@/features/company/repository";
import { DEFAULT_COMPANY_FIELDS } from "@/features/company/schemas";

export default async function CompanySettingsPage() {
  const username = await requireCurrentUsername();
  const profile = await findCompanyProfile(username);
  return (
    <main className="settings-page">
      <nav className="breadcrumbs" aria-label="パンくずリスト"><Link href="/">ホーム</Link><span><span aria-hidden="true">/</span>企業情報</span></nav>
      <p className="eyebrow">Company profile</p>
      <h1>企業情報の設定</h1>
      <p className="settings-lead">記事で選択した考え方を自社へ当てはめて分析する際に使用します。必要な項目を自由に追加・削除できます。</p>
      <aside className="privacy-notice"><strong>入力時の注意</strong><p>個人情報、取引先の実名、認証情報、未公開の機密情報は入力しないでください。企業名は匿名名でも構いません。</p></aside>
      <CompanyProfileForm initialFields={profile?.fields ?? DEFAULT_COMPANY_FIELDS} />
    </main>
  );
}
