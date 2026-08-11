"use client";

import { useCallback, useEffect, useState } from "react";
import type { VocabularyItem } from "../types";

type VocabularySidebarProps = { items?: VocabularyItem[] };
const OWNER_KEY = "smec-vocabulary-owner";

export function VocabularySidebar({ items: initialItems = [] }: VocabularySidebarProps) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    let ownerId = localStorage.getItem(OWNER_KEY);
    if (!ownerId) {
      ownerId = crypto.randomUUID();
      localStorage.setItem(OWNER_KEY, ownerId);
    }
    const response = await fetch(`/api/vocabulary?ownerId=${encodeURIComponent(ownerId)}`);
    if (!response.ok) return;
    const data = (await response.json()) as { items: VocabularyItem[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    window.addEventListener("vocabulary-updated", refresh);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("vocabulary-updated", refresh);
    };
  }, [refresh]);

  const filtered = items.filter((item) => item.term.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  return (
    <aside className="vocabulary-panel" id="vocabulary-panel" aria-labelledby="vocabulary-title">
      <div className="vocabulary-heading"><div><p className="eyebrow">My vocabulary</p><h2 id="vocabulary-title">単語帳</h2></div><span className="vocabulary-count" aria-label={`${items.length}件`}>{items.length}</span></div>
      <label className="vocabulary-search"><span className="visually-hidden">単語帳を検索</span><span aria-hidden="true">⌕</span><input onChange={(event) => setQuery(event.target.value)} placeholder="保存した用語を検索" type="search" value={query} /></label>
      {filtered.length ? (
        <ul className="vocabulary-list">{filtered.map((item) => (
          <li key={item.id}><button aria-expanded={openId === item.id} onClick={() => setOpenId(openId === item.id ? null : item.id)} type="button"><strong>{item.term}</strong><span>{item.explanation.definition}</span></button>{openId === item.id ? <div className="vocabulary-detail"><p>{item.explanation.details}</p><strong>試験上のポイント</strong><p>{item.explanation.examPoint}</p></div> : null}</li>
        ))}</ul>
      ) : (
        <div className="vocabulary-empty"><span className="empty-book" aria-hidden="true">＋</span><h3>{items.length ? "該当する用語がありません" : "まだ用語がありません"}</h3><p>記事の文字を選択し、Geminiの解説から保存できます。</p></div>
      )}
      <div className="vocabulary-tip"><span aria-hidden="true">i</span><p>保存した用語はこのブラウザの匿名IDに紐づきます。</p></div>
    </aside>
  );
}
