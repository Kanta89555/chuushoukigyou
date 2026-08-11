import { CurriculumTree } from "./CurriculumTree";
import { MobileCurriculumDrawer } from "./MobileCurriculumDrawer";
import { curriculum } from "../curriculum";

export function MobileCurriculum({ activeIds = [], completedIds = [] }: { activeIds?: string[]; completedIds?: string[] }) {
  return (
    <MobileCurriculumDrawer>
      <CurriculumTree activeIds={activeIds} completedIds={completedIds} nodes={curriculum.children ?? []} />
    </MobileCurriculumDrawer>
  );
}
