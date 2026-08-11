import Link from "next/link";
import { requireCurrentUsername } from "@/features/auth/session";
import { CurriculumSidebar } from "@/features/curriculum/components/CurriculumSidebar";
import { MobileCurriculum } from "@/features/curriculum/components/MobileCurriculum";
import { VocabularySidebar } from "@/features/vocabulary/components/VocabularySidebar";
import {
  countUnits,
  curriculum,
  getCurriculumStats,
  getNodeHref,
} from "@/features/curriculum/curriculum";

export default async function Home() {
  await requireCurrentUsername();
  const stats = getCurriculumStats();
  const subjects = curriculum.children ?? [];

  return (
    <main className="learning-layout">
      <CurriculumSidebar />

      <article className="article-panel home-panel">
        <MobileCurriculum />
        <p className="eyebrow">Curriculum overview</p>
        <h1>知識の地図から、学びを始める。</h1>
        <p className="lead">
          中小企業診断士試験の論点を、科目から単元へたどりながら体系的に学べます。
        </p>

        <dl className="stats" aria-label="カリキュラムの概要">
          <div><dt>科目</dt><dd>{stats.subjectCount}</dd></div>
          <div><dt>カテゴリ</dt><dd>{stats.categoryCount}</dd></div>
          <div><dt>学習単元</dt><dd>{stats.unitCount}</dd></div>
        </dl>

        <section className="subject-section">
          <div className="section-heading">
            <p className="eyebrow">Subjects</p>
            <h2>科目から選ぶ</h2>
          </div>
          <div className="subject-grid">
            {subjects.map((subject, index) => (
              <Link className="subject-card" href={getNodeHref([], subject)} key={subject.id}>
                <span className="subject-number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{subject.title}</strong>
                <small>{countUnits(subject)}単元</small>
              </Link>
            ))}
          </div>
        </section>
      </article>

      <VocabularySidebar />
    </main>
  );
}
