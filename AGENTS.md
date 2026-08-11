# AGENTS.md

## Overview

中小企業診断士試験の学習内容を体系的に閲覧・理解するためのWebアプリケーション。単なる問題演習アプリではなく、「全体像を見る → 記事を読む → 分からない専門用語を調べる → 単語帳へ保存する」という学習体験を中心に設計する。ユーザーが知識体系を俯瞰しながら各論点を掘り下げられることを最優先とする。

**主要技術**: Next.js（App Router） / TypeScript / React / Vercel / PostgreSQL（Neonを第一候補とするVercel Marketplace Postgres） / Gemini API（Google GenAI SDK） / JSON（学習体系管理） / Markdown（記事管理）

---

## Product

### Core Concept

画面の基本構造：

```text
┌──────────────────────────────────────────────────────────────┐
│ 中小企業診断士を学ぶ                 🔍       📖単語帳       │
├─────────────┬──────────────────────────────┬─────────────────┤
│ 全体マップ  │       今読んでいる記事        │    単語一覧     │
│ 企業経営理論│  経営戦略                     │  競争優位       │
│   ├ 戦略    │ 企業が持続的に成長するためには…│  VRIO           │
│   └ ...     │ 競争優位を構築するには……     │  規模の経済     │
│ 財務会計 ...│   [競争優位] ←クリック可能   │                 │
│             │  ┌──────────────────────┐    │                 │
│             │  │ 競争優位／AIによる説明 │    │                 │
│             │  │ ＋ 単語帳に保存       │    │                 │
│             │  └──────────────────────┘    │                 │
└─────────────┴──────────────────────────────┴─────────────────┘
```

PC: 左＝学習体系 / 中央＝記事 / 右＝単語一覧 / 記事内 or ポップオーバー＝AI用語解説。右側の単語一覧には現在の記事の主要専門用語を表示し、記事本文の用語と同様にクリックでAI用語解説を開ける。モバイルでは左サイドバーをDrawer形式に変える。

### Principles

- 「ページ数を増やす」より「知識同士の関係が分かる」ことを優先する。
- ユーザーは常に、知識体系の中で今どこを学習しているかを把握できるようにする。
- 画面遷移を必要以上に増やさない。専門用語を調べても記事ページから離れない（Overlay / Popover / Drawerで表示）。
- AI機能がなくても記事閲覧機能そのものは利用可能でなければならない。

---

## Domain Model

- **Curriculum** — 学習体系（科目/大分類/中分類/小分類/記事の関係）。JSONで管理。
- **Articles** — Codexが生成・編集する学習記事。Markdownが基本形式。
- **Terms** — 記事中の専門用語（例：競争優位, VRIO, 規模の経済, ROE, 損益分岐点, IS-LM分析）。
- **AI Explanation** — 選択された専門用語をGemini APIで説明する機能。
- **Vocabulary** — ユーザーが保存した専門用語・AI説明。将来的に復習/理解度管理に利用。
- **Search** — 科目・記事・専門用語の横断検索。

---

## Data Architecture

### Curriculum

学習体系はDBではなくJSONをSource of Truthとする。理由：Gitで変更履歴を管理できる／Codexが編集しやすい／DB管理画面が不要／記事との対応関係を明示しやすい／将来他資格へ展開しやすい。

階層（概念）：`資格 → 科目 → 大分類 → 中分類 → 小分類 → 記事`。すべての階層を使う必要はない。**階層数をUIへハードコードせず**、Tree Rendererが再帰的に処理できる設計にする。

基本ファイル：`content/curriculum/smec.json`（smec = Small and Medium Enterprise Consultant）

ノード構造（概念）：
```ts
type CurriculumNode = {
  id: string;          // 表示名から生成しない。一度設定したら安易に変更しない
  title: string;        // 変更してもURL/データ参照が壊れないよう id と分離する
  slug: string;          // URL用。kebab-case
  type: string;           // 階層の種別（科目/大分類/中分類…）
  article?: string;       // 対応する記事ID（あれば）
  children?: CurriculumNode[];
};
```
例：`企業経営理論 └─ 経営戦略 ├─ 経営戦略の基礎 ├─ 競争戦略 └─ 成長戦略`

### Articles

記事はMarkdownが基本。本文をPostgreSQLへ直接保存せず、Git管理されたコンテンツとして扱う。ファイル名とURL設計を完全に依存させない。

推奨構造：
```text
content/articles/
  business-management/strategy/
    management-strategy.md
    competitive-strategy.md
    growth-strategy.md
  finance/ economics/ operations/
  business-law/ information-systems/ sme-policy/
```

記事にはFront Matter（またはそれに相当するmetadata）を持たせる。最低限：
```ts
type ArticleMeta = {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  updatedAt: string;   // ISO 8601
  keywords: string[];
};
```

**執筆方針**: 記事生成時、Codexは必ず既存curriculum JSONを確認し、存在しないカテゴリを独断で追加しない。新カテゴリが必要な場合は「curriculumへの変更」と「article追加」を別変更として扱う。試験対策の暗記文章にせず、`概念 → なぜ必要か → 仕組み → 具体例 → 関連概念 → 試験上のポイント` の順を基本とする。可能な限り「なぜそうなるか」を説明し、専門用語を専門用語だけで説明する文章を避ける。

### Markdown Components

Markdown表示層とReact UIを分離する。将来的に記事内で使える拡張コンポーネント候補：`Definition / Example / Important / Comparison / Diagram / ExamPoint / RelatedTerms`。初期段階からMDXへ過度に依存せず、Markdownで実現できるものはMarkdownを使う。Reactコンポーネントが必要になった時点でMDX採用を検討する。

---

## AI Integration

### Term Interaction

記事内の重要語句をクリック可能にする。記事文章そのものへ大量のReactコードを書き込まず、記事データとTerm UIを分離する。クリック時にAI Explanation機能へ渡す情報は必要最小限：
```ts
type TermLookupInput = {
  term: string;
  articleId: string;
  surroundingContext: string;
};
```
AI説明は記事ページを離れず表示する。

### Gemini Architecture

Gemini通信は `lib/ai/` へ隔離し、**UIコンポーネントからGoogle SDK・Gemini APIを直接呼び出さない**（API keyの扱いは [Security](#performance--security) を参照）。処理の流れ：`UI → Server API → AI Service → Gemini`。

Gemini固有の型・レスポンス形式をアプリ全体へ拡散させず、`generateTermExplanation()` のようなアプリ独自interface（AI Provider Adapter）を通す。これにより将来Gemini以外のモデルへ変更してもUIへの影響を最小化する。

### Prompt Policy

「○○を説明してください」のような単純な送信をせず、可能な範囲で以下を入力に含める：`資格 / 科目 / 記事タイトル / 専門用語 / 周辺文章 / 説明レベル`。「中小企業診断士を学習しているユーザー向け」であることをGeminiに明示する。

出力は構造化出力を使用し、最低限 `簡潔な定義 / 詳しい説明 / 具体例 / 関連用語 / 試験上のポイント` を含める構造を目指す。AIから返された自由文章を直接アプリの内部データ構造として扱わず、Zod等でvalidationし、失敗時の挙動も考慮する。

### Cost Policy

Gemini APIを不用意に何度も呼ばない。同一用語・同一文脈の生成結果は再利用できる設計にする。保存時は以下を保持し、プロンプト/モデル変更時に古いキャッシュと区別できるようにする：
```ts
type AIExplanationCache = {
  term: string;
  contextHash: string;
  model: string;
  promptVersion: string;
  response: string;
  createdAt: string;
};
```

---

## Database

PostgreSQL（Vercel Marketplace経由、第一候補Neon）を使用する。DBはユーザー固有データ・動的データのみを保存し、静的コンテンツ（curriculum/articles）は無理にDBへ保存しない。

責務分離：
```text
Git / JSON / Markdown → 学習コンテンツ
PostgreSQL            → ユーザーデータ
Gemini API             → 動的AI生成
```

初期段階で保存するテーブル：`User / Vocabulary / AIExplanationCache`。将来的に `ArticleProgress / LearningHistory / Bookmark / QuizResult / Note / StudySession` などを追加可能とするが、**未来の機能のために最初から巨大なSchemaを作らず、必要になるまでテーブルを作らない**。

### Vocabulary

単なる文字列リストにせず、最低限：
```ts
type Vocabulary = {
  id: string;
  userId: string;
  term: string;
  explanation: string;
  articleId: string;
  createdAt: string;
};
```
将来的に `understandingLevel / reviewCount / lastReviewedAt / nextReviewAt / favorite / memo` を追加できる構造を想定するが、初期実装では最小限に留める。

### Access Layer

DBアクセスをReact Componentへ直接書かず、専用のData Access Layerへ集約する（`lib/db/queries/` または `features/<name>/repository.ts`）。SQL/ORM操作をUI Componentへ書かない。ORMを採用する場合はアプリケーション全体から直接利用せずRepository層を経由し、その時点でNext.js/Vercel/Neonとの互換性を確認して選ぶ（古い慣習だけを理由に特定ORMを導入しない）。

---

## Application Architecture

### Next.js

App Routerを使用し、Pages Routerを新規実装に使わない。`app` はrouting layerとして扱い、ビジネスロジックを集中させない。Server Componentsをデフォルトとし、`"use client"` は必要なコンポーネントにのみ付け、状態管理が必要というだけの理由でServer ComponentをClientへ変更しない。

### Project Structure

```text
src/
├── app/                     # layout.tsx, page.tsx, learn/[...slug]/, vocabulary/, api/ai/explain/
├── components/
│   ├── layout/              # Header, AppShell, Sidebar
│   └── ui/                  # 汎用UI（Button, Dialog, Input）
├── features/                # curriculum, articles, terms, vocabulary, search
│   └── <name>/              # components/, types.ts, schema.ts, repository.ts, actions.ts
├── lib/
│   ├── ai/                  # provider.ts, gemini.ts, prompts.ts, schemas.ts
│   ├── db/
│   └── utils/
├── config/
└── types/

content/                     # src外に分離する静的コンテンツ
├── curriculum/smec.json
└── articles/business-management/ finance/ economics/ ...
```

汎用UI（Button, Dialog, Input）は `components/ui/` へ、ビジネス固有UI（VocabularyCard, CurriculumTree, TermExplanation, ArticleViewer）は対応する `features/` へ置く。

### Dependency Direction

`app → features → lib` の一方向。逆方向の依存を作らず、`lib` が `features` をimportしない。features同士は無制限に直接importせず、複数featureで共有すべきものだけを共通層へ移動する。

### Server / Client Boundary

Server側を優先：`記事取得 / curriculum取得 / DB読み書き / 認証 / Gemini API / 検索インデックス生成`。Client側でよいもの：`Sidebar開閉 / Tree展開 / Popover / Dialog / 選択状態 / 一時的UI状態 / キーボード操作`。ブラウザでしか必要ない処理を理由なくServerへ移動せず、その逆も行わない。

### API Routes

Route Handlerは外部APIとの境界やHTTP endpointが必要な場所（例：`POST /api/ai/explain`）で使う。アプリ内部の単純なmutationすべてをAPI Route化せず、自然な処理ではServer Actionsを検討する。AI providerのように明確なHTTP境界を持たせたい処理ではRoute Handlerを使ってよい。

---

## Cross-Cutting Concerns

### Validation

外部入力（`Route Handler input / Server Action input / Gemini output / Database input / URL params / JSON curriculum / Article metadata`）は信用せず、必ずvalidationする。TypeScript型だけをruntime validationとして扱わず、Zod等のschema validationを使う。

### Search

初期段階では過剰な検索インフラを導入しない。対象：`記事タイトル / 記事本文 / 専門用語 / curriculum`。データ規模が小さい間はbuild-time indexやサーバー内検索を検討し、増えた場合のみ `PostgreSQL Full Text Search / 外部Search Engine / Embedding Search` を検討する。最初からVector Databaseを導入しない。

### State Management

グローバルState Managerを最初から導入せず、`Server state → URL → Server Component → local component state → Context → global state library` の順で検討する。URLで表現できるもの（現在の記事・検索Query・フィルタ）はURLを優先し、Popoverの開閉など一時的な状態はlocal stateとする。

### URL Design

記事URLは人間にも理解しやすくする（例：`/learn/business-management/strategy/competitive-strategy`）。内部データの参照にはslugだけでなく安定したIDを使い、URL変更とDB identityを分離する。

### Error Handling

失敗を握りつぶさない。Gemini APIやDB保存が失敗しても記事閲覧自体を失敗させず、AI説明部分・単語帳保存部分だけでエラー表示する。ユーザー向けエラーと開発者向けエラーを区別し、秘密情報をエラーメッセージへ含めない。

### Loading States

AI生成には時間がかかりうるため、明確なLoading UIを表示する。記事全体をAIレスポンス待ちにせず、AI Explanation領域だけをloading stateとし、Skeletonまたはprogress indicatorを適切に使う。

---

## UI / UX

### Principles

コンテンツそのものを主役とし、過剰なカードUIやすべてを枠線で囲むことを避ける。記事領域は長文を読みやすい幅に制限する。Sidebarは情報量が多くても現在地が分かりやすいようにし、現在表示中の記事に対応するTree Nodeを強調表示する。Sidebarの展開状態をユーザー操作中に不必要にリセットしない。

### Desktop Layout

```text
Header: Logo/Title, Search, Vocabulary
Main:   Curriculum Sidebar | Article Content | Term List
```
記事内でTermを選択、またはTerm Listから選択した場合、いずれもTerm Explanationを表示する。表示方法は画面幅に応じて `Popover / Side Panel / Dialog / Bottom Sheet` から選ぶ。

### Responsive

PC専用UIを作らない。スマートフォンでは左Curriculum SidebarをDrawer形式にし、`Header / Article / Bottom Sheet / Drawer Navigation` を基本とする。Sidebarをそのまま縮小せず、タップ領域を十分確保する。

### Accessibility

HTMLのsemantic structureを優先し、クリック可能要素を `div` だけで実装しない（`button / a / nav / main / article / aside` を適切に使う）。キーボード操作に対応し、Focus stateを削除しない。Dialog/Popoverはaria属性とfocus managementを考慮する。

---

## Performance & Security

### Performance

測定前の過剰最適化は避けるが、以下は原則として守る：Server Componentsを活用する／不要なJavaScriptをClientへ送らない／巨大なClient Componentを作らない／記事データ全件をブラウザへ送らない／curriculum Treeを必要十分なサイズに保つ／Gemini APIを記事初期表示時に呼び出さず、ユーザー操作時のみ生成する。

### Security

以下をClient Bundleへ絶対に含めない：`GEMINI_API_KEY / DATABASE_URL / 認証Secret / Server-only credentials`。`.env` はGitへcommitせず、`.env.example` のみcommit可能とする。Gemini APIへ任意の巨大テキストをそのまま送信できないよう入力サイズを制限し、API endpointは将来的なrate limitを導入できる構造にする。AI生成結果は信頼されたHTMLとして直接renderしない。

### Environment Variables

`DATABASE_URL / GEMINI_API_KEY`（将来は認証関連も追加）。名前をコンポーネント内へ散在させず、server-only config moduleから参照する。

---

## Code Conventions

### Naming

`Component: PascalCase / 関数: camelCase / Type: PascalCase / 定数: UPPER_SNAKE_CASE / URL slug: kebab-case`。ファイル名は役割に応じて一貫性を保ち、意味のない略語を避ける。`data.ts` `utils.ts` `helper.ts` のような曖昧な巨大ファイルを作らず、責務を名前で表現する。

### TypeScript

`any` を安易に使わず、型エラー回避のためだけのtype assertionを使わない。外部データはruntime validationを通してから型付けし、Domain TypeとExternal API Typeを可能な限り分離する（Gemini SDKのresponse型・DBのraw row型をUIへ直接渡さない）。

### Testing

重要なBusiness Logicにテストを追加し、特に以下を優先する：`Curriculum parser / Article resolver / Vocabulary validation / Gemini response parser / Prompt builder / URL/article mapping`。UI snapshot testを大量に作るより、壊れると影響が大きいロジックを優先する。Bugを修正するときは可能であれば再現Testを追加してから修正する。

---

## Agent Operating Rules

### Before Starting

実装開始前に必ず関連ファイルを読み、既存設計を理解せず新しいarchitectureを導入しない。複雑な変更では実装前に短いplan（`変更対象 / 変更理由 / 影響範囲 / 検証方法`）を作る。単純な変更では過剰なplanを作らなくてよい。

タスクに応じて最初に読むファイル：
- 記事追加: `AGENTS.md / curriculum JSON / 類似article / article metadata schema`
- AI機能変更: `AGENTS.md / lib/ai / Route Handler / schema / 関連test`
- DB変更: `AGENTS.md / database schema / repository / migration / 関連feature`

### Change Policy

要求されていない大規模refactorを同時に行わず、「ついでの修正」を増やさない。既存のworking codeを理由なく書き換えず、1つのタスクで複数のarchitecture patternを混在させない。同じ問題を解決する既存utilityがあれば再利用し、新しいdependencyは本当に必要か確認してから追加する（標準APIまたは既存dependencyで実現できる場合は避ける）。

### Self Review & Completion

変更完了後、プロジェクトで利用可能な `TypeScript / lint / test / build` を実行する。変更差分を確認し、`不要な変更 / 重複コード / 秘密情報 / debug log / dead code / 型安全性の低下 / Client Componentの過剰化` がないか確認する。

タスクは「コードを書いたら完了」ではなく、以下をすべて満たして完了とする：要求された動作が実装されている／既存機能を不必要に破壊していない／TypeScript errorがない／利用可能なlint/test/buildを通過している／security上の問題を追加していない／不要なdependencyを追加していない／変更内容を説明できる。

### Article Generation

記事作成タスクではコードを変更せず、原則として `content/articles/` `content/curriculum/` のみ変更する。生成時はcurriculumの現在位置を確認し、同じ階層の既存記事を読んで粒度を揃え、既存記事との重複を避ける。専門用語候補は自然な文章の中へ含め、試験用語を無理に詰め込まない。

---

## Do Not Do

以下は禁止する（詳細は各章を参照）：

- Pages Routerによる新規ページ作成（→ Next.js）
- API keyのClient利用、Gemini SDK/APIのUIからの直接呼び出し（→ Security, Gemini Architecture）
- 記事本文・curriculum構造のReact/UIへのハードコード（→ Data Architecture）
- 巨大な単一page component、すべてをClient Componentにすること（→ Performance）
- DB queryのUI componentへの直接記述（→ Access Layer）
- 外部入力・AI出力のvalidationなしでの使用/保存（→ Validation）
- 理由のないglobal state library導入、理由のないmicroservice化
- 最初からのVector Database導入、将来使うかもしれないだけのtable作成
- AGENTS.mdの方針を無視したarchitecture変更

---

## Roadmap

### Initial MVP

以下だけを完成させる：`全体マップ表示 / 記事表示 / 記事内専門用語クリック / Geminiによる説明 / 単語帳保存 / 単語帳一覧 / 基本検索`。ログイン・学習進捗・テスト・AIチューターなどはMVP必須ではない。まず「読む → 調べる → 保存する」という体験を完成させる。

### Future Extensions

将来追加できるarchitectureを維持する：`ユーザー認証 / 学習進捗 / 記事Bookmark / 自分用Note / 理解度 / 復習間隔 / クイズ / 過去問リンク / AI Tutor / AI質問 / 記事横断検索 / Semantic Search / 学習履歴 / 管理画面 / 記事編集CMS / 複数資格（応用情報技術者試験・簿記・宅建など）`。ただし現在のMVPへ先回りして実装しない。

### Multi Qualification Strategy

将来的に中小企業診断士以外へ拡張する可能性があるため、`smec` という資格IDを使用し、「中小企業診断士だけ存在する」という前提をコードへ過度に埋め込まない。概念的には `Qualification → Curriculum → Article` として扱う。ただしMVP段階では中小企業診断士のみUIへ表示してよい。

---

## Architecture Philosophy

「将来のために何でも抽象化する」ことを拡張性とは考えない。拡張性とは `責務が分離されている / 依存方向が明確 / データ構造が安定 / 外部サービスが隔離されている / 変更箇所を限定できる` 状態を指す。不要な抽象化より明確な境界を優先し、最初は単純に実装し、2つ以上の具体的ユースケースが現れてから共通化を検討する。

### Final Instruction to Codex

このプロジェクトでは「最もコード量の多い解決策」ではなく「現在の要件を満たしながら将来変更しやすい最も単純な解決策」を選ぶこと。既存architectureを尊重し、不明点は既存コード・curriculum・記事・schemaから意図を推測する（推測だけで大規模なarchitecture変更はしない）。

ユーザー体験として最も重要なのは `全体像を理解する → 記事を読む → 分からない言葉に気付く → その場で理解する → 知識として保存する` という学習ループである。すべての実装判断は、この学習体験を複雑にしないことを基準に行う。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
