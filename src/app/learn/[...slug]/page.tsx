import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCurrentUsername } from "@/features/auth/session";
import { CurriculumSidebar } from "@/features/curriculum/components/CurriculumSidebar";
import { MobileCurriculum } from "@/features/curriculum/components/MobileCurriculum";
import { VocabularySidebar } from "@/features/vocabulary/components/VocabularySidebar";
import { findVocabularies } from "@/features/vocabulary/repository";
import { readArticle } from "@/features/articles/article";
import { TermLearningWorkspace } from "@/features/terms/components/TermLearningWorkspace";
import { NextUnitButton } from "@/features/progress/components/NextUnitButton";
import { findCompletedArticleIds } from "@/features/progress/repository";
import {
  countUnits,
  findNodeBySlugs,
  getNextUnit,
  getNodeHref,
} from "@/features/curriculum/curriculum";

type LearnPageProps = {
  params: Promise<{ slug: string[] }>;
};

export default async function LearnPage({ params }: LearnPageProps) {
  const username = await requireCurrentUsername();
  const vocabularyItems = await findVocabularies(username);
  const completedIds = await findCompletedArticleIds(username);
  const { slug } = await params;
  const match = findNodeBySlugs(slug);
  if (!match) notFound();

  const { node, ancestors } = match;
  const activeIds = [...ancestors, node].map((item) => item.id);
  const children = node.children ?? [];
  const articleMarkdown = node.type === "unit" && node.article ? await readArticle(node.article) : null;
  const subject = ancestors.find((item) => item.type === "subject")?.title ?? "中小企業診断士";
  const nextUnit = node.type === "unit" ? getNextUnit(node.id) : undefined;

  return (
    <main className="learning-layout">
      <CurriculumSidebar activeIds={activeIds} completedIds={completedIds} />

      <article className="article-panel">
        <MobileCurriculum activeIds={activeIds} completedIds={completedIds} />
        <nav aria-label="パンくずリスト" className="breadcrumbs">
          <Link href="/">全体マップ</Link>
          {ancestors.slice(1).map((ancestor, index) => (
            <span key={ancestor.id}>
              <span aria-hidden="true">/</span>
              <Link href={getNodeHref(ancestors.slice(1, index + 1), ancestor)}>
                {ancestor.title}
              </Link>
            </span>
          ))}
        </nav>

        <p className="node-type">{node.type === "unit" ? "学習単元" : "カリキュラム"}</p>
        {node.type !== "unit" ? <h1>{node.title}</h1> : null}

        {node.type === "unit" ? (
          articleMarkdown ? <><TermLearningWorkspace articleId={node.id} articleTitle={node.title} markdown={articleMarkdown} subject={subject} />{nextUnit ? <NextUnitButton articleId={node.id} nextHref={nextUnit.href} nextTitle={nextUnit.node.title} /> : null}</> : null
        ) : (
          <>
            <p className="lead">この領域には{countUnits(node)}件の学習単元があります。</p>
            <section className="unit-list-section">
              <p className="eyebrow">Contents</p>
              <h2>{node.type === "subject" ? "カテゴリ" : "学習単元"}</h2>
              <div className="unit-list">
                {children.map((child, index) => (
                  <Link className={child.type === "unit" && completedIds.includes(child.id) ? "completed" : undefined} href={getNodeHref([...ancestors, node], child)} key={child.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{child.title}</strong>
                    {child.children ? <small>{countUnits(child)}単元</small> : null}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </article>

      <VocabularySidebar items={vocabularyItems} />
    </main>
  );
}
