"use client";

import { useEffect, useState } from "react";
import type { TermQuiz } from "../types";

export function TermQuizDialog({ quiz, onClose }: { quiz: TermQuiz; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string; correctChoiceId: string } | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  async function answer() {
    if (!selected) return;
    setMessage("");
    const response = await fetch("/api/term-quiz/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ termId: quiz.termId, choiceId: selected }) });
    const data = await response.json() as { correct?: boolean; explanation?: string; correctChoiceId?: string; error?: string };
    if (!response.ok || data.correct === undefined || !data.explanation || !data.correctChoiceId) { setMessage(data.error ?? "回答を判定できませんでした。"); return; }
    setResult({ correct: data.correct, explanation: data.explanation, correctChoiceId: data.correctChoiceId });
  }

  return <div className="quiz-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-labelledby="term-quiz-title" aria-modal="true" className="term-quiz-dialog" role="dialog"><div className="term-quiz-heading"><div><p className="eyebrow">4択チェック</p><h2 id="term-quiz-title">{quiz.term}</h2></div><button aria-label="閉じる" onClick={onClose} type="button">×</button></div><p className="term-quiz-question">{quiz.question}</p><div className="term-quiz-choices">{quiz.choices.map((choice, index) => { const state = result ? choice.id === result.correctChoiceId ? "correct" : choice.id === selected ? "incorrect" : "" : ""; return <label className={state} key={choice.id}><input checked={selected === choice.id} disabled={Boolean(result)} name="term-quiz-choice" onChange={() => setSelected(choice.id)} type="radio" /><span><strong>{index + 1}</strong>{choice.text}</span></label>; })}</div>{result ? <div className={`term-quiz-result ${result.correct ? "correct" : "incorrect"}`}><strong>{result.correct ? "正解です" : "不正解です"}</strong><p>{result.explanation}</p></div> : <button className="primary-button" disabled={!selected} onClick={() => void answer()} type="button">回答する</button>}{message ? <p className="term-message" role="alert">{message}</p> : null}</section></div>;
}
