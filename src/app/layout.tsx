import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "中小企業診断士を学ぶ",
  description: "中小企業診断士試験の知識体系を俯瞰して学ぶアプリ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="header">
          <Link className="brand" href="/">
            <span className="brand-mark">SMEC</span>
            <span>中小企業診断士を学ぶ</span>
          </Link>
          <nav aria-label="主要メニュー" className="header-actions">
            <button disabled type="button">検索</button>
            <a href="#vocabulary-panel">単語帳</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
