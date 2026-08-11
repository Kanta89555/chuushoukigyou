import { CurriculumTree } from "./CurriculumTree";
import { curriculum } from "../curriculum";

export function CurriculumSidebar({ activeIds = [] }: { activeIds?: string[] }) {
  return (
    <aside className="curriculum-panel" aria-labelledby="curriculum-title">
      <p className="eyebrow">Learning map</p>
      <h2 id="curriculum-title">全体マップ</h2>
      <CurriculumTree activeIds={activeIds} nodes={curriculum.children ?? []} />
    </aside>
  );
}
