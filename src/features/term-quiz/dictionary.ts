import dictionaryData from "../../../content/terms/smec-terms.json";
import type { TermDictionaryEntry, TermQuiz } from "./types";

const dictionary = dictionaryData as TermDictionaryEntry[];
const byId = new Map(dictionary.map((entry) => [entry.id, entry]));

export function getTermById(id: string) { return byId.get(id); }
export function getTermsForArticle(articleId: string) { return dictionary.filter((entry) => entry.articleId === articleId); }

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let state = hash(seed);
  for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createQuiz(termId: string): TermQuiz | undefined {
  const correct = byId.get(termId);
  if (!correct) return undefined;
  const candidates = dictionary.filter((entry) => entry.id !== termId && entry.definition !== correct.definition);
  const preferred = candidates.filter((entry) => entry.subjectId === correct.subjectId);
  const pool = preferred.length >= 3 ? preferred : candidates;
  const distractors = deterministicShuffle(pool, termId).slice(0, 3);
  const choices = deterministicShuffle([correct, ...distractors], `${termId}-choices`).map((entry) => ({ id: entry.id, text: entry.definition }));
  return { termId, term: correct.term, question: `「${correct.term}」の説明として最も適切なものはどれですか。`, choices };
}
