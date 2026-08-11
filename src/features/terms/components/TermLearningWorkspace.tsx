"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { TermExplanation } from "@/lib/ai/schemas";

type Props = {
  articleId: string;
  articleTitle: string;
  subject: string;
  markdown: string;
};

type Selection = { term: string; context: string };

const OWNER_KEY = "smec-vocabulary-owner";

export function TermLearningWorkspace({ articleId, articleTitle, subject, markdown }: Props) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [explanation, setExplanation] = useState<TermExplanation | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving">("idle");
  const [message, setMessage] = useState("");

  function captureSelection() {
    const nativeSelection = window.getSelection();
    const term = nativeSelection?.toString().trim() ?? "";
    if (!term || term.length > 100 || !articleRef.current || !nativeSelection?.anchorNode) return;
    if (!articleRef.current.contains(nativeSelection.anchorNode)) return;

    const text = articleRef.current.innerText;
    const index = text.indexOf(term);
    const start = Math.max(0, index - 500);
    const context = text.slice(start, Math.min(text.length, index + term.length + 500));
    setSelection({ term, context });
    setExplanation(null);
    setMessage("");
  }

  async function explain() {
    if (!selection) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: selection.term,
          articleId,
          articleTitle,
          subject,
          surroundingContext: selection.context,
        }),
      });
      const data = (await response.json()) as { explanation?: TermExplanation; error?: string };
      if (!response.ok || !data.explanation) throw new Error(data.error);
      setExplanation(data.explanation);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "解説を生成できませんでした。");
    } finally {
      setStatus("idle");
    }
  }

  async function save() {
    if (!selection || !explanation) return;
    const ownerId = getOrCreateOwnerId();
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, term: selection.term, articleId, explanation }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      window.dispatchEvent(new Event("vocabulary-updated"));
      setMessage("単語帳へ保存しました。");
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "保存できませんでした。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="markdown-article" onPointerUp={captureSelection} ref={articleRef}>
        <ReactMarkdown skipHtml>{markdown}</ReactMarkdown>
      </div>

      {selection ? (
        <section className="term-explanation" aria-live="polite" aria-label={`${selection.term}のAI解説`}>
          <div className="term-explanation-heading">
            <div><p className="eyebrow">Gemini explanation</p><h2>{selection.term}</h2></div>
            <button aria-label="解説を閉じる" onClick={() => { setSelection(null); setExplanation(null); }} type="button">×</button>
          </div>
          {!explanation ? (
            <button className="primary-button" disabled={status === "loading"} onClick={explain} type="button">
              {status === "loading" ? "解説を生成中…" : "Geminiで解説する"}
            </button>
          ) : (
            <div className="term-explanation-body">
              <p className="term-definition">{explanation.definition}</p>
              <h3>詳しい説明</h3><p>{explanation.details}</p>
              <h3>具体例</h3><p>{explanation.example}</p>
              <h3>関連用語</h3><p>{explanation.relatedTerms.join("・") || "なし"}</p>
              <h3>試験上のポイント</h3><p>{explanation.examPoint}</p>
              <button className="primary-button" disabled={status === "saving"} onClick={save} type="button">
                {status === "saving" ? "保存中…" : "単語帳に保存"}
              </button>
            </div>
          )}
          {message ? <p className="term-message">{message}</p> : null}
        </section>
      ) : null}
    </>
  );
}

function getOrCreateOwnerId() {
  const current = localStorage.getItem(OWNER_KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(OWNER_KEY, created);
  return created;
}
