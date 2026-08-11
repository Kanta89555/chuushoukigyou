"use client";

export function MobileMapButton() {
  return (
    <button
      aria-controls="mobile-curriculum-drawer"
      className="mobile-map-button"
      onClick={() => window.dispatchEvent(new Event("open-curriculum-drawer"))}
      type="button"
    >
      <span aria-hidden="true">☰</span>
      <span>学習マップ</span>
    </button>
  );
}
