import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUsername } from "@/features/auth/session";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { MobileMapButton } from "@/features/curriculum/components/MobileMapButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "中小企業診断士を学ぶ",
  description: "中小企業診断士試験の知識体系を俯瞰して学ぶアプリ",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const username = await getCurrentUsername();
  return (
    <html lang="ja">
      <body>
        <header className="header">
          {username ? <MobileMapButton /> : null}
          <Link className="brand" href="/">
            <span className="brand-mark">SMEC</span>
            <span>中小企業診断士を学ぶ</span>
          </Link>
          <nav aria-label="主要メニュー" className="header-actions">
            <button disabled type="button">検索</button>
            <a href="#vocabulary-panel">単語帳</a>
            {username ? <Link href="/settings/company">設定</Link> : null}
            {username ? <><span>{username}</span><LogoutButton /></> : null}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
