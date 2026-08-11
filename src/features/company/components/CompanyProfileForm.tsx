"use client";

import { useState } from "react";
import type { CompanyField } from "../schemas";

export function CompanyProfileForm({ initialFields }: { initialFields: CompanyField[] }) {
  const [fields, setFields] = useState(initialFields);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [message, setMessage] = useState("");

  function update(id: string, key: "label" | "value", value: string) {
    setFields((current) => current.map((field) => field.id === id ? { ...field, [key]: value } : field));
  }

  function addField() {
    if (fields.length >= 20) return;
    setFields((current) => [...current, { id: crypto.randomUUID(), label: "", value: "" }]);
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/company-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      const data = (await response.json()) as { error?: string; profile?: { fields: CompanyField[] } };
      if (!response.ok || !data.profile) throw new Error(data.error);
      setFields(data.profile.fields);
      setMessage("企業情報を保存しました。");
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "企業情報を保存できませんでした。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="company-profile-form">
      <div className="company-fields">
        {fields.map((field, index) => (
          <section className="company-field" key={field.id}>
            <div className="company-field-heading">
              <label htmlFor={`company-label-${field.id}`}>項目 {index + 1}</label>
              <button aria-label={`項目${index + 1}を削除`} onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))} type="button">削除</button>
            </div>
            <input id={`company-label-${field.id}`} maxLength={50} onChange={(event) => update(field.id, "label", event.target.value)} placeholder="項目名（例：業種）" value={field.label} />
            <textarea maxLength={1000} onChange={(event) => update(field.id, "value", event.target.value)} placeholder="Geminiの分析に使う企業情報を入力" rows={4} value={field.value} />
          </section>
        ))}
      </div>
      <button className="company-add-button" disabled={fields.length >= 20} onClick={addField} type="button">＋ 項目を追加</button>
      <div className="company-save-area">
        <button className="primary-button" disabled={status === "saving"} onClick={save} type="button">{status === "saving" ? "保存中…" : "企業情報を保存"}</button>
        {message ? <p className="term-message" role="status">{message}</p> : null}
      </div>
    </div>
  );
}
