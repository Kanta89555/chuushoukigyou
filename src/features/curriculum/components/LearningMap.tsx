"use client";

import Link from "next/link";
import { type PointerEvent, type WheelEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SavedCompanyAnalysis } from "@/features/company-analysis/types";
import type { VocabularyItem } from "@/features/vocabulary/types";
import type { LearningMapData, LearningMapNode } from "../map-types";

type Transform = { x: number; y: number; scale: number };
type UnitDetails = { vocabularies: VocabularyItem[]; analyses: SavedCompanyAnalysis[] };
const MIN_SCALE = 0.025;
const MAX_SCALE = 1.8;

export function LearningMap({ data }: { data: LearningMapData }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 0.1 });
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState("all");
  const [selected, setSelected] = useState<LearningMapNode | null>(null);
  const [details, setDetails] = useState<UnitDetails | null>(null);
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "error">("idle");

  const fitAll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scale = Math.max(MIN_SCALE, Math.min(0.16, Math.min((viewport.clientWidth - 48) / data.width, (viewport.clientHeight - 48) / data.height)));
    setTransform({ x: (viewport.clientWidth - data.width * scale) / 2, y: (viewport.clientHeight - data.height * scale) / 2, scale });
  }, [data.height, data.width]);

  useEffect(() => {
    fitAll();
    const observer = new ResizeObserver(fitAll);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [fitAll]);

  const focusNode = useCallback((node: LearningMapNode, targetScale?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale ?? (node.type === "unit" ? 0.9 : node.type === "category" ? 0.42 : 0.14)));
    setTransform({
      x: viewport.clientWidth / 2 - (node.x + node.width / 2) * scale,
      y: viewport.clientHeight / 2 - (node.y + node.height / 2) * scale,
      scale,
    });
  }, []);

  const zoomAt = useCallback((nextScale: number, screenX: number, screenY: number) => {
    setTransform((current) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const worldX = (screenX - current.x) / current.scale;
      const worldY = (screenY - current.y) / current.scale;
      return { x: screenX - worldX * scale, y: screenY - worldY * scale, scale };
    });
  }, []);

  function wheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    zoomAt(transform.scale * Math.exp(-event.deltaY * 0.0015), event.clientX - rect.left, event.clientY - rect.top);
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const before = [...pointers.current.values()];
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = [...pointers.current.values()];
    if (after.length === 1) {
      setTransform((current) => ({ ...current, x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y }));
      return;
    }
    if (after.length === 2) {
      const oldDistance = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y);
      const newDistance = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
      if (!oldDistance) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = (after[0].x + after[1].x) / 2 - rect.left;
      const centerY = (after[0].y + after[1].y) / 2 - rect.top;
      zoomAt(transform.scale * (newDistance / oldDistance), centerX, centerY);
    }
  }

  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
  }

  async function openUnit(node: LearningMapNode) {
    setSelected(node);
    setDetails(null);
    setDetailStatus("loading");
    focusNode(node);
    try {
      const response = await fetch(`/api/map/unit?articleId=${encodeURIComponent(node.id)}`);
      if (!response.ok) throw new Error();
      setDetails(await response.json() as UnitDetails);
      setDetailStatus("idle");
    } catch {
      setDetailStatus("error");
    }
  }

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => normalizedQuery ? data.nodes.filter((node) => `${node.title} ${node.state?.searchText ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)).slice(0, 20) : [], [data.nodes, normalizedQuery]);
  const matchIds = new Set(matches.map((node) => node.id));
  const semanticLevel = transform.scale < 0.2 ? "subjects" : transform.scale < 0.5 ? "categories" : "units";
  const inverseScale = 1 / transform.scale;

  function chooseSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId);
    if (nextSubjectId === "all") fitAll();
    else {
      const node = data.nodes.find((candidate) => candidate.id === nextSubjectId);
      if (node) focusNode(node, 0.14);
    }
  }

  function goToCurrent() {
    const currentId = window.localStorage.getItem("current-article-id");
    const node = data.nodes.find((candidate) => candidate.id === currentId);
    if (node) void openUnit(node);
  }

  return (
    <section className="learning-map-shell" aria-label="学習マップ">
      <div className="learning-map-toolbar">
        <div><p className="eyebrow">Knowledge atlas</p><h1>学習マップ</h1></div>
        <div className="map-search-area">
          <label><span className="visually-hidden">単元・保存内容を検索</span><input onChange={(event) => setQuery(event.target.value)} placeholder="単元・保存内容を検索" type="search" value={query} /></label>
          {matches.length ? <ul className="map-search-results">{matches.map((node) => <li key={node.id}><button onClick={() => node.type === "unit" ? void openUnit(node) : focusNode(node)} type="button"><strong>{node.title}</strong><span>{node.type === "unit" ? "学習単元" : node.type}</span></button></li>)}</ul> : null}
        </div>
      </div>

      <div className="map-subject-filter" aria-label="科目フィルター">
        <button className={subjectId === "all" ? "active" : ""} onClick={() => chooseSubject("all")} type="button">すべて</button>
        {data.subjects.map((subject) => <button className={subjectId === subject.id ? "active" : ""} key={subject.id} onClick={() => chooseSubject(subject.id)} type="button">{subject.title}</button>)}
      </div>

      <div className="learning-map-viewport" onPointerCancel={pointerEnd} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onWheel={wheel} ref={viewportRef}>
        <div className="learning-map-canvas" style={{ width: data.width, height: data.height, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}>
          <svg aria-hidden="true" className="map-edges" height={data.height} width={data.width}>{data.edges.map((edge) => <path d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX + 90} ${edge.fromY}, ${edge.toX - 90} ${edge.toY}, ${edge.toX} ${edge.toY}`} key={edge.id} />)}</svg>
          {data.nodes.map((node) => {
            const semanticHidden = semanticLevel === "subjects" ? !["qualification", "subject"].includes(node.type) : semanticLevel === "categories" ? node.type === "unit" : false;
            const filtered = subjectId !== "all" && node.subjectId !== subjectId && node.type !== "qualification";
            const highlighted = normalizedQuery ? matchIds.has(node.id) : false;
            const semanticScale = semanticLevel === "subjects" && ["qualification", "subject"].includes(node.type) ? inverseScale : semanticLevel === "categories" && node.type !== "unit" ? Math.min(inverseScale, 3) : 1;
            return <button aria-label={node.title} className={`map-node map-node-${node.type}${node.state?.completed ? " completed" : ""}${filtered ? " filtered" : ""}${highlighted ? " highlighted" : ""}`} key={node.id} onClick={() => node.type === "unit" ? void openUnit(node) : focusNode(node)} style={{ left: node.x, top: node.y, width: node.width, height: node.height, opacity: semanticHidden ? 0 : undefined, pointerEvents: semanticHidden ? "none" : undefined, transform: `scale(${semanticScale})` }} type="button"><strong>{node.title}</strong>{node.type === "unit" ? <span className="map-node-meta"><span>✓ {node.state?.completed ? "学習済み" : "未学習"}</span><span>用語 {node.state?.vocabularyCount ?? 0}</span><span>分析 {node.state?.analysisCount ?? 0}</span></span> : <small>{node.type === "qualification" ? "資格" : node.type === "subject" ? "科目" : "カテゴリ"}</small>}</button>;
          })}
        </div>
        <div className="map-controls" aria-label="マップ操作">
          <button aria-label="拡大" onClick={() => zoomAt(transform.scale * 1.35, (viewportRef.current?.clientWidth ?? 0) / 2, (viewportRef.current?.clientHeight ?? 0) / 2)} type="button">＋</button>
          <button aria-label="縮小" onClick={() => zoomAt(transform.scale / 1.35, (viewportRef.current?.clientWidth ?? 0) / 2, (viewportRef.current?.clientHeight ?? 0) / 2)} type="button">−</button>
          <button onClick={fitAll} type="button">全体</button>
          <button onClick={goToCurrent} type="button">現在地</button>
        </div>
        <div className="map-zoom-hint">{semanticLevel === "subjects" ? "科目をタップして詳しく表示" : semanticLevel === "categories" ? "さらに拡大すると学習単元を表示" : "単元をタップして保存内容を確認"}</div>
      </div>

      {selected ? <UnitSheet details={details} node={selected} onClose={() => setSelected(null)} status={detailStatus} /> : null}
    </section>
  );
}

function UnitSheet({ node, details, status, onClose }: { node: LearningMapNode; details: UnitDetails | null; status: "idle" | "loading" | "error"; onClose: () => void }) {
  return <aside aria-labelledby="map-unit-title" aria-modal="true" className="map-unit-sheet" role="dialog"><div className="map-sheet-handle" /><div className="map-sheet-heading"><div><p className="eyebrow">学習単元</p><h2 id="map-unit-title">{node.title}</h2></div><button aria-label="閉じる" onClick={onClose} type="button">×</button></div><div className="map-sheet-stats"><span>{node.state?.completed ? "✓ 学習済み" : "未学習"}</span><span>用語 {node.state?.vocabularyCount ?? 0}件</span><span>企業分析 {node.state?.analysisCount ?? 0}件</span></div>{status === "loading" ? <p className="map-sheet-message">保存内容を読み込んでいます…</p> : null}{status === "error" ? <p className="map-sheet-message" role="alert">保存内容を取得できませんでした。</p> : null}{details?.vocabularies.length ? <section><h3>保存した用語</h3><ul>{details.vocabularies.map((item) => <li key={item.id}><strong>{item.term}</strong><span>{item.explanation.definition}</span></li>)}</ul></section> : null}{details?.analyses.length ? <section><h3>保存した企業分析</h3><ul>{details.analyses.map((item) => <li key={item.id}><strong>{item.selectedContent}</strong><span>{item.analysis.currentAnalysis}</span></li>)}</ul></section> : null}{status === "idle" && details && !details.vocabularies.length && !details.analyses.length ? <p className="map-sheet-message">この単元に保存した内容はありません。</p> : null}{node.href ? <Link className="primary-button map-open-article" href={node.href}>記事を開く</Link> : null}</aside>;
}
