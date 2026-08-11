import { CurriculumTree } from "./CurriculumTree";
import { curriculum } from "../curriculum";

export function MobileCurriculum({ activeIds = [], completedIds = [] }: { activeIds?: string[]; completedIds?: string[] }) {
  return (
    <details className="mobile-curriculum">
      <summary>全体マップを開く</summary>
      <nav aria-label="モバイル学習マップ">
        <CurriculumTree activeIds={activeIds} completedIds={completedIds} nodes={curriculum.children ?? []} />
      </nav>
    </details>
  );
}
