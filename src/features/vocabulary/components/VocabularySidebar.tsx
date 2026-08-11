"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import type { SavedCompanyAnalysis } from "@/features/company-analysis/types";
import type { VocabularyItem } from "../types";

type Props = {
  items?: VocabularyItem[];
  analysisItems?: SavedCompanyAnalysis[];
};

export function VocabularySidebar({ items: initialItems = [], analysisItems: initialAnalysisItems = [] }: Props) {
  const [items, setItems] = useState(initialItems);
  const [analysisItems, setAnalysisItems] = useState(initialAnalysisItems);
  const [tab, setTab] = useState<"vocabulary" | "analysis">("vocabulary");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const removeVocabulary = useCallback(async (id: string) => {
    const response = await fetch("/api/vocabulary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return false;
    setItems((current) => current.filter((item) => item.id !== id));
    setOpenId((current) => current === id ? null : current);
    return true;
  }, []);

  const removeAnalysis = useCallback(async (id: string) => {
    const response = await fetch("/api/company-analyses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return;
    setAnalysisItems((current) => current.filter((item) => item.id !== id));
    setOpenId((current) => current === id ? null : current);
  }, []);

  const refreshVocabulary = useCallback(async () => {
    const response = await fetch("/api/vocabulary");
    if (!response.ok) return;
    const data = (await response.json()) as { items: VocabularyItem[] };
    setItems(data.items);
  }, []);

  const refreshAnalyses = useCallback(async () => {
    const response = await fetch("/api/company-analyses");
    if (!response.ok) return;
    const data = (await response.json()) as { items: SavedCompanyAnalysis[] };
    setAnalysisItems(data.items);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refreshVocabulary();
      void refreshAnalyses();
    }, 0);
    window.addEventListener("vocabulary-updated", refreshVocabulary);
    window.addEventListener("company-analysis-updated", refreshAnalyses);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("vocabulary-updated", refreshVocabulary);
      window.removeEventListener("company-analysis-updated", refreshAnalyses);
    };
  }, [refreshAnalyses, refreshVocabulary]);

  const normalizedQuery = query.toLocaleLowerCase();
  const filteredVocabulary = items.filter((item) => item.term.toLocaleLowerCase().includes(normalizedQuery));
  const filteredAnalyses = analysisItems.filter((item) =>
    `${item.selectedContent} ${item.articleTitle}`.toLocaleLowerCase().includes(normalizedQuery),
  );
  const activeCount = tab === "vocabulary" ? items.length : analysisItems.length;

  return (
    <aside className="vocabulary-panel" id="vocabulary-panel" aria-labelledby="saved-items-title">
      <div className="vocabulary-heading">
        <div><p className="eyebrow">Saved learning</p><h2 id="saved-items-title">保存リスト</h2></div>
        <div className="vocabulary-heading-actions"><span className="vocabulary-count" aria-label={`${activeCount}件`}>{activeCount}</span><a className="vocabulary-close" href="#" aria-label="保存リストを閉じる">×</a></div>
      </div>
      <div className="saved-content-tabs" role="tablist" aria-label="保存内容">
        <button aria-selected={tab === "vocabulary"} className={tab === "vocabulary" ? "active" : ""} onClick={() => { setTab("vocabulary"); setOpenId(null); }} role="tab" type="button">単語帳</button>
        <button aria-selected={tab === "analysis"} className={tab === "analysis" ? "active" : ""} onClick={() => { setTab("analysis"); setOpenId(null); }} role="tab" type="button">企業分析</button>
      </div>
      <label className="vocabulary-search"><span className="visually-hidden">保存内容を検索</span><span aria-hidden="true">⌕</span><input onChange={(event) => setQuery(event.target.value)} placeholder={tab === "vocabulary" ? "保存した用語を検索" : "保存した企業分析を検索"} type="search" value={query} /></label>

      {tab === "vocabulary" ? (
        filteredVocabulary.length ? <ul className="vocabulary-list">{filteredVocabulary.map((item) => <VocabularyListItem item={item} key={item.id} onDelete={removeVocabulary} onToggle={() => setOpenId(openId === item.id ? null : item.id)} open={openId === item.id} />)}</ul> : <EmptyState hasItems={items.length > 0} type="vocabulary" />
      ) : (
        filteredAnalyses.length ? <ul className="vocabulary-list">{filteredAnalyses.map((item) => (
          <li className="vocabulary-item" key={item.id}>
            <div className="vocabulary-item-content">
              <div className="vocabulary-item-row">
                <button aria-expanded={openId === item.id} className="vocabulary-item-toggle" onClick={() => setOpenId(openId === item.id ? null : item.id)} type="button"><strong>{item.selectedContent}</strong><span>{item.articleTitle}</span></button>
                <button aria-label={`${item.selectedContent}の企業分析を削除`} className="vocabulary-delete-button analysis-delete-button" onClick={() => void removeAnalysis(item.id)} type="button">削除</button>
              </div>
              {openId === item.id ? <div className="vocabulary-detail saved-analysis-detail"><strong>現状分析</strong><p>{item.analysis.currentAnalysis}</p><strong>推奨する方針</strong><ul>{item.analysis.recommendations.map((recommendation, index) => <li key={`${item.id}-${index}`}>{recommendation}</li>)}</ul></div> : null}
            </div>
          </li>
        ))}</ul> : <EmptyState hasItems={analysisItems.length > 0} type="analysis" />
      )}
    </aside>
  );
}

function EmptyState({ hasItems, type }: { hasItems: boolean; type: "vocabulary" | "analysis" }) {
  return <div className="vocabulary-empty"><span className="empty-book" aria-hidden="true">◇</span><h3>{hasItems ? "検索結果がありません" : type === "vocabulary" ? "まだ用語がありません" : "まだ企業分析がありません"}</h3><p>{type === "vocabulary" ? "記事の文字を選択し、Geminiの解説から保存できます。" : "記事の文字を選択し、自社分析の結果から保存できます。"}</p></div>;
}

type VocabularyListItemProps = { item: VocabularyItem; open: boolean; onToggle: () => void; onDelete: (id: string) => Promise<boolean> };

function VocabularyListItem({ item, open, onToggle, onDelete }: VocabularyListItemProps) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    startX.current = event.clientX - offset;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    setOffset(Math.max(-84, Math.min(0, event.clientX - startX.current)));
  }
  function pointerUp() {
    if (startX.current === null) return;
    setOffset(offset < -42 ? -84 : 0);
    startX.current = null;
  }
  async function remove() {
    setDeleting(true);
    if (!(await onDelete(item.id))) setDeleting(false);
  }

  return <li className="vocabulary-item"><button className="vocabulary-swipe-delete" disabled={deleting} onClick={remove} type="button">削除</button><div className="vocabulary-item-content" onPointerCancel={pointerUp} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} style={{ transform: `translateX(${offset}px)` }}><div className="vocabulary-item-row"><button aria-expanded={open} className="vocabulary-item-toggle" onClick={onToggle} type="button"><strong>{item.term}</strong><span>{item.explanation.definition}</span></button><button aria-label={`${item.term}を削除`} className="vocabulary-delete-button" disabled={deleting} onClick={remove} type="button">削除</button></div>{open ? <div className="vocabulary-detail"><p>{item.explanation.details}</p><strong>試験上のポイント</strong><p>{item.explanation.examPoint}</p></div> : null}</div></li>;
}
