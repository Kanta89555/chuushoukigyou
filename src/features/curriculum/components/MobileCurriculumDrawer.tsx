"use client";

import Link from "next/link";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

export function MobileCurriculumDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function openDrawer() {
      setOffset(0);
      setOpen(true);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("open-curriculum-drawer", openDrawer);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("open-curriculum-drawer", openDrawer);
      window.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function close() {
    setOpen(false);
    setOffset(0);
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(".mobile-map-button")?.focus(), 0);
  }

  function pointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse") return;
    pointerStart.current = event.clientX - offset;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerStart.current === null) return;
    setOffset(Math.min(0, event.clientX - pointerStart.current));
  }

  function pointerUp() {
    if (pointerStart.current === null) return;
    if (offset < -90) close();
    else setOffset(0);
    pointerStart.current = null;
  }

  return (
    <div aria-hidden={!open} className={`mobile-curriculum${open ? " open" : ""}`}>
      <button aria-label="学習マップを閉じる" className="curriculum-backdrop" onClick={close} tabIndex={open ? 0 : -1} type="button" />
      <aside
        aria-labelledby="mobile-curriculum-title"
        aria-modal="true"
        className="curriculum-drawer"
        id="mobile-curriculum-drawer"
        inert={!open}
        onPointerCancel={pointerUp}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        role="dialog"
        style={{ transform: open ? `translateX(${offset}px)` : "translateX(-100%)" }}
      >
        <div className="curriculum-drawer-heading">
          <div><p className="eyebrow">Learning map</p><h2 id="mobile-curriculum-title">学習マップ</h2></div>
          <button aria-label="学習マップを閉じる" onClick={close} ref={closeButton} type="button">×</button>
        </div>
        <nav aria-label="モバイル学習マップ" onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) close();
        }}>
          <Link className="open-visual-map-link" href="/map">拡大できる全体マップを開く</Link>
          {children}
        </nav>
      </aside>
    </div>
  );
}
