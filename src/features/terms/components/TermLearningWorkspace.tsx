"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CompanyAnalysis, TermExplanation } from "@/lib/ai/schemas";

type Props = { articleId: string; articleTitle: string; subject: string; markdown: string };
type Selection = { content: string; context: string };
type Mode = "explanation" | "analysis";

export function TermLearningWorkspace({ articleId, articleTitle, subject, markdown }: Props) {
  const articleRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [explanation, setExplanation] = useState<TermExplanation | null>(null);
  const [analysis, setAnalysis] = useState<CompanyAnalysis | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving">("idle");
  const [message, setMessage] = useState("");
  const [needsCompanyProfile, setNeedsCompanyProfile] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("current-article-id", articleId);
  }, [articleId]);

  function captureSelection() {
    const nativeSelection = window.getSelection();
    const content = nativeSelection?.toString().trim() ?? "";
    if (!content || content.length > 500 || !articleRef.current || !nativeSelection?.anchorNode) return;
    if (!articleRef.current.contains(nativeSelection.anchorNode)) return;
    const text = articleRef.current.innerText;
    const index = text.indexOf(content);
    const start = Math.max(0, index - 500);
    const context = text.slice(start, Math.min(text.length, index + content.length + 500));
    setSelection({ content, context });
    setMode(null);
    setExplanation(null);
    setAnalysis(null);
    setMessage("");
    setNeedsCompanyProfile(false);
  }

  async function explain() {
    if (!selection) return;
    if (selection.content.length > 100) {
      setMessage("用語解説では100文字以内を選択してください。企業分析はこのまま利用できます。");
      return;
    }
    setMode("explanation");
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: selection.content, articleId, articleTitle, subject, surroundingContext: selection.context }),
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

  async function analyzeCompany() {
    if (!selection) return;
    setMode("analysis");
    setStatus("loading");
    setMessage("");
    setNeedsCompanyProfile(false);
    try {
      const response = await fetch("/api/ai/company-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedContent: selection.content, articleId, articleTitle, subject, surroundingContext: selection.context }),
      });
      const data = (await response.json()) as { analysis?: CompanyAnalysis; error?: string; needsCompanyProfile?: boolean };
      if (!response.ok || !data.analysis) {
        setNeedsCompanyProfile(Boolean(data.needsCompanyProfile));
        throw new Error(data.error);
      }
      setAnalysis(data.analysis);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "企業分析を生成できませんでした。");
    } finally {
      setStatus("idle");
    }
  }

  async function save() {
    if (!selection || !explanation) return;
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: selection.content, articleId, explanation }),
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

  async function saveAnalysis() {
    if (!selection || !analysis) return;
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/company-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedContent: selection.content,
          articleId,
          articleTitle,
          subject,
          analysis,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      window.dispatchEvent(new Event("company-analysis-updated"));
      setMessage("企業分析を保存しました。");
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "企業分析を保存できませんでした。");
    } finally {
      setStatus("idle");
    }
  }

  function close() {
    setSelection(null);
    setExplanation(null);
    setAnalysis(null);
    setMode(null);
  }

  return (
    <>
      <div className="markdown-article" onPointerUp={captureSelection} ref={articleRef}>
        <ReactMarkdown components={{ table: ({ children }) => <div className="markdown-table-wrapper"><table>{children}</table></div> }} remarkPlugins={[remarkGfm]} skipHtml>{markdown}</ReactMarkdown>
      </div>

      {selection ? (
        <section className="term-explanation" aria-live="polite" aria-label={`${selection.content}のAI機能`}>
          <div className="term-explanation-heading">
            <div><p className="eyebrow">AI</p><h2>{selection.content}</h2></div>
            <button aria-label="閉じる" onClick={close} type="button">×</button>
          </div>
          <div className="analysis-mode-actions">
            <button className={mode === "explanation" ? "active" : ""} disabled={status !== "idle"} onClick={explain} type="button">用語を解説</button>
            <button className={mode === "analysis" ? "active" : ""} disabled={status !== "idle"} onClick={analyzeCompany} type="button">自社に当てはめて分析</button>
          </div>
          {status === "loading" ? <p className="ai-loading">AIが生成しています…</p> : null}
          {mode === "explanation" && explanation ? <ExplanationResult explanation={explanation} onSave={save} saving={status === "saving"} /> : null}
          {mode === "analysis" && analysis ? <CompanyAnalysisResult analysis={analysis} onSave={saveAnalysis} saving={status === "saving"} /> : null}
          {message ? <p className="term-message" role="alert">{message}</p> : null}
          {needsCompanyProfile ? <Link className="company-settings-link" href="/settings/company">企業情報を設定する →</Link> : null}
        </section>
      ) : null}
    </>
  );
}

function ExplanationResult({ explanation, onSave, saving }: { explanation: TermExplanation; onSave: () => void; saving: boolean }) {
  return <div className="term-explanation-body"><p className="term-definition">{explanation.definition}</p><h3>詳しい説明</h3><p>{explanation.details}</p><h3>具体例</h3><p>{explanation.example}</p><h3>関連用語</h3><p>{explanation.relatedTerms.join("・") || "なし"}</p><h3>試験上のポイント</h3><p>{explanation.examPoint}</p><button className="primary-button" disabled={saving} onClick={onSave} type="button">{saving ? "保存中…" : "単語帳に保存"}</button></div>;
}

function CompanyAnalysisResult({ analysis, onSave, saving }: { analysis: CompanyAnalysis; onSave: () => void; saving: boolean }) {
  return <div className="company-analysis-result"><h3>分析の前提</h3><p>{analysis.assumptions}</p><h3>考え方の適用</h3><p>{analysis.application}</p><h3>現状分析</h3><p>{analysis.currentAnalysis}</p><AnalysisList title="強み" items={analysis.strengths} /><AnalysisList title="課題" items={analysis.issues} /><AnalysisList title="推奨する方針" items={analysis.recommendations} /><AnalysisList title="具体的なアクション" items={analysis.actions} /><AnalysisList title="リスクと注意点" items={analysis.risks} /><AnalysisList title="追加で確認したい情報" items={analysis.missingInformation} /><h3>学習上のポイント</h3><p>{analysis.learningPoint}</p><button className="primary-button" disabled={saving} onClick={onSave} type="button">{saving ? "保存中…" : "企業分析を保存"}</button></div>;
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <section><h3>{title}</h3><ul>{items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul></section>;
}
