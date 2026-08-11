import type { CurriculumNode } from "./types";
import type { LearningMapData, LearningMapEdge, LearningMapNode, UnitMapState } from "./map-types";
import { getNodeHref } from "./curriculum";

const COLUMN_GAP = 320;
const ROW_GAP = 76;
const PADDING = 180;

export function buildLearningMap(root: CurriculumNode, states: Record<string, UnitMapState>): LearningMapData {
  const nodes: LearningMapNode[] = [];
  const edges: LearningMapEdge[] = [];
  let leafIndex = 0;

  function visit(node: CurriculumNode, ancestors: CurriculumNode[], depth: number, subjectId?: string): LearningMapNode {
    const currentSubjectId = node.type === "subject" ? node.id : subjectId;
    const children = node.children?.map((child) => visit(child, [...ancestors, node], depth + 1, currentSubjectId)) ?? [];
    const y = children.length
      ? children.reduce((total, child) => total + child.y, 0) / children.length
      : PADDING + leafIndex++ * ROW_GAP;
    const width = node.type === "unit" ? 272 : 190;
    const height = node.type === "unit" ? 60 : 52;
    const mapNode: LearningMapNode = {
      id: node.id,
      title: node.title,
      type: node.type,
      depth,
      x: PADDING + depth * COLUMN_GAP,
      y,
      width,
      height,
      href: node.type === "unit" ? getNodeHref(ancestors, node) : undefined,
      subjectId: currentSubjectId,
      state: node.type === "unit" ? states[node.id] ?? { completed: false, vocabularyCount: 0, analysisCount: 0, searchText: "" } : undefined,
    };
    nodes.push(mapNode);
    children.forEach((child) => edges.push({
      id: `${node.id}-${child.id}`,
      fromX: mapNode.x + mapNode.width,
      fromY: mapNode.y + mapNode.height / 2,
      toX: child.x,
      toY: child.y + child.height / 2,
    }));
    return mapNode;
  }

  visit(root, [], 0);
  return {
    nodes,
    edges,
    width: PADDING * 2 + COLUMN_GAP * 3 + 272,
    height: Math.max(800, PADDING * 2 + Math.max(0, leafIndex - 1) * ROW_GAP),
    subjects: (root.children ?? []).map(({ id, title }) => ({ id, title })),
  };
}
