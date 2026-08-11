import { requireCurrentUsername } from "@/features/auth/session";
import { curriculum } from "@/features/curriculum/curriculum";
import { buildLearningMap } from "@/features/curriculum/map-data";
import { findUnitMapStates } from "@/features/curriculum/map-repository";
import { LearningMap } from "@/features/curriculum/components/LearningMap";

export default async function MapPage() {
  const username = await requireCurrentUsername();
  const states = await findUnitMapStates(username);
  const data = buildLearningMap(curriculum, states);
  return <main className="learning-map-page"><LearningMap data={data} /></main>;
}
