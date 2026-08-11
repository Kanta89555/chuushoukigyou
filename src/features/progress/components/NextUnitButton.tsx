"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NextUnitButtonProps = {
  articleId: string;
  nextHref: string;
  nextTitle: string;
};

export function NextUnitButton({ articleId, nextHref, nextTitle }: NextUnitButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function goNext() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      router.push(nextHref);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "次の単元へ移動できませんでした。");
      setLoading(false);
    }
  }

  return (
    <nav className="next-unit-navigation" aria-label="次の学習単元">
      <p><span>次の単元</span><strong>{nextTitle}</strong></p>
      <button className="primary-button" disabled={loading} onClick={goNext} type="button">{loading ? "保存中…" : "次へ →"}</button>
      {error ? <p className="term-message" role="alert">{error}</p> : null}
    </nav>
  );
}
