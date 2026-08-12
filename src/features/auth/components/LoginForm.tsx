"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "ログインできませんでした。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={login}>
      <label htmlFor="password">合言葉</label>
      <input autoComplete="current-password" autoFocus id="password" maxLength={200} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      <button className="primary-button" disabled={loading} type="submit">{loading ? "ログイン中…" : "ログイン"}</button>
      {error ? <p className="term-message" role="alert">{error}</p> : null}
    </form>
  );
}
