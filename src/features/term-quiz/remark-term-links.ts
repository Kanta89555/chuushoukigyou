import type { Root, Text, Parent } from "mdast";
import { visit } from "unist-util-visit";
import type { TermDictionaryEntry } from "./types";

const excluded = new Set(["heading", "link", "linkReference", "code", "inlineCode"]);

export function remarkTermLinks(options: { terms: TermDictionaryEntry[] }) {
  const terms = [...options.terms].sort((a, b) => b.term.length - a.term.length);
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (index === undefined || !parent || excluded.has(parent.type)) return;
      const matches: { start: number; end: number; entry: TermDictionaryEntry }[] = [];
      for (const entry of terms) {
        let start = node.value.indexOf(entry.term);
        while (start >= 0) {
          const end = start + entry.term.length;
          if (!matches.some((match) => start < match.end && end > match.start)) matches.push({ start, end, entry });
          start = node.value.indexOf(entry.term, end);
        }
      }
      if (!matches.length) return;
      matches.sort((a, b) => a.start - b.start);
      const children: Text[] = [];
      let cursor = 0;
      for (const match of matches) {
        if (match.start > cursor) children.push({ type: "text", value: node.value.slice(cursor, match.start) });
        children.push({
          type: "text",
          value: match.entry.term,
          data: { hName: "button", hProperties: { className: ["term-quiz-trigger"], type: "button", "data-term-id": match.entry.id } },
        });
        cursor = match.end;
      }
      if (cursor < node.value.length) children.push({ type: "text", value: node.value.slice(cursor) });
      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
}
