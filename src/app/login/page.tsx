import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getCurrentUsername } from "@/features/auth/session";

export default async function LoginPage() {
  if (await getCurrentUsername()) redirect("/");
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">SMEC learning</p>
        <h1>ログイン</h1>
        <p>合言葉を入力すると、どのブラウザからでも同じ学習データを利用できます。</p>
        <LoginForm />
      </section>
    </main>
  );
}
