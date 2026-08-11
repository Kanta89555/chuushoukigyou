import { CurriculumTree } from "./CurriculumTree";
import { curriculum } from "../curriculum";

export function MobileCurriculum({ activeIds = [] }: { activeIds?: string[] }) {
  return (
    <details className="mobile-curriculum">
      <summary>全体マップを開く</summary>
      <nav aria-label="モバイル学習マップ">
        <CurriculumTree activeIds={activeIds} nodes={curriculum.children ?? []} />
      </nav>
    </details>
  );
}
