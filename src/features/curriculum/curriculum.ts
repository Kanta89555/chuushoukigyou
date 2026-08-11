import curriculumData from "../../../content/curriculum/smec.json";
import type { CurriculumMatch, CurriculumNode } from "./types";

export const curriculum = curriculumData as CurriculumNode;

export function getNodeHref(ancestors: CurriculumNode[], node: CurriculumNode) {
  const segments = [...ancestors, node]
    .filter((item) => item.type !== "qualification")
    .map((item) => item.slug);

  return `/learn/${segments.join("/")}`;
}

export function findNodeBySlugs(slugs: string[]): CurriculumMatch | undefined {
  let current = curriculum;
  const ancestors: CurriculumNode[] = [curriculum];

  for (const slug of slugs) {
    const child = current.children?.find((item) => item.slug === slug);
    if (!child) return undefined;

    current = child;
    if (slug !== slugs.at(-1)) ancestors.push(child);
  }

  return { node: current, ancestors };
}

export function countUnits(node: CurriculumNode): number {
  if (node.type === "unit") return 1;
  return node.children?.reduce((total, child) => total + countUnits(child), 0) ?? 0;
}

export function getNextUnit(currentId: string): { node: CurriculumNode; href: string } | undefined {
  const units: { node: CurriculumNode; ancestors: CurriculumNode[] }[] = [];

  function collect(node: CurriculumNode, ancestors: CurriculumNode[]) {
    if (node.type === "unit") units.push({ node, ancestors });
    node.children?.forEach((child) => collect(child, [...ancestors, node]));
  }

  collect(curriculum, []);
  const currentIndex = units.findIndex(({ node }) => node.id === currentId);
  const next = units[currentIndex + 1];
  return next ? { node: next.node, href: getNodeHref(next.ancestors, next.node) } : undefined;
}

export function getCurriculumStats() {
  const subjects = curriculum.children ?? [];
  const categories = subjects.flatMap((subject) => subject.children ?? []);

  return {
    subjectCount: subjects.length,
    categoryCount: categories.length,
    unitCount: countUnits(curriculum),
  };
}
