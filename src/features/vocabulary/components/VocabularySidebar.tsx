"use client";

import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import type { VocabularyItem } from "../types";

type VocabularySidebarProps = { items?: VocabularyItem[] };
export function VocabularySidebar({ items: initialItems = [] }: VocabularySidebarProps) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
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

  const refresh = useCallback(async () => {
    const response = await fetch("/api/vocabulary");
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
      <div className="vocabulary-heading"><div><p className="eyebrow">My vocabulary</p><h2 id="vocabulary-title">単語帳</h2></div><div className="vocabulary-heading-actions"><span className="vocabulary-count" aria-label={`${items.length}件`}>{items.length}</span><a className="vocabulary-close" href="#" aria-label="単語帳を閉じる">×</a></div></div>
      <label className="vocabulary-search"><span className="visually-hidden">単語帳を検索</span><span aria-hidden="true">⌕</span><input onChange={(event) => setQuery(event.target.value)} placeholder="保存した用語を検索" type="search" value={query} /></label>
      {filtered.length ? (
        <ul className="vocabulary-list">{filtered.map((item) => (
          <VocabularyListItem item={item} key={item.id} onDelete={remove} onToggle={() => setOpenId(openId === item.id ? null : item.id)} open={openId === item.id} />
        ))}</ul>
      ) : (
        <div className="vocabulary-empty"><span className="empty-book" aria-hidden="true">＋</span><h3>{items.length ? "該当する用語がありません" : "まだ用語がありません"}</h3><p>記事の文字を選択し、Geminiの解説から保存できます。</p></div>
      )}
      <div className="vocabulary-tip"><span aria-hidden="true">i</span><p>保存した用語はこのブラウザの匿名IDに紐づきます。</p></div>
    </aside>
  );
}

type VocabularyListItemProps = {
  item: VocabularyItem;
  open: boolean;
  onToggle: () => void;
  onDelete: (id: string) => Promise<boolean>;
};

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

  return (
    <li className="vocabulary-item">
      <button className="vocabulary-swipe-delete" disabled={deleting} onClick={remove} type="button">削除</button>
      <div className="vocabulary-item-content" onPointerCancel={pointerUp} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} style={{ transform: `translateX(${offset}px)` }}>
        <div className="vocabulary-item-row">
          <button className="vocabulary-item-toggle" aria-expanded={open} onClick={onToggle} type="button"><strong>{item.term}</strong><span>{item.explanation.definition}</span></button>
          <button className="vocabulary-delete-button" disabled={deleting} onClick={remove} type="button" aria-label={`${item.term}を削除`}>削除</button>
        </div>
        {open ? <div className="vocabulary-detail"><p>{item.explanation.details}</p><strong>試験上のポイント</strong><p>{item.explanation.examPoint}</p></div> : null}
      </div>
    </li>
  );
}
