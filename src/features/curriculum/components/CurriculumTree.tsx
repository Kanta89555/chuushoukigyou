import Link from "next/link";
import { countUnits, getNodeHref } from "../curriculum";
import type { CurriculumNode } from "../types";

type CurriculumTreeProps = {
  nodes: CurriculumNode[];
  ancestors?: CurriculumNode[];
  activeIds?: string[];
  completedIds?: string[];
};

export function CurriculumTree({
  nodes,
  ancestors = [],
  activeIds = [],
  completedIds = [],
}: CurriculumTreeProps) {
  return (
    <ul className="curriculum-tree">
      {nodes.map((node) => {
        const isActive = activeIds.includes(node.id);
        const href = getNodeHref(ancestors, node);

        if (node.children?.length) {
          return (
            <li key={node.id}>
              <details open={isActive}>
                <summary>
                  <span>{node.title}</span>
                  <small>{countUnits(node)}</small>
                </summary>
                <Link className={isActive ? "tree-overview active" : "tree-overview"} href={href}>
                  概要を見る
                </Link>
                <CurriculumTree
                  activeIds={activeIds}
                  completedIds={completedIds}
                  ancestors={[...ancestors, node]}
                  nodes={node.children}
                />
              </details>
            </li>
          );
        }

        return (
          <li key={node.id}>
            <Link className={`tree-link${isActive ? " active" : ""}${completedIds.includes(node.id) ? " completed" : ""}`} href={href}>
              {node.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
