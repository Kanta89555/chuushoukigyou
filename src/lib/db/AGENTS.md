# AGENTS.md

# Scope

このAGENTS.mdは、このプロジェクトにおけるデータベース設計、DBアクセス、Schema変更、Migration、Query実装に適用する。

主な対象ディレクトリは、

```text
src/lib/db/
```

とする。

採用するMigrationまたはORMツールに応じて追加されるDB関連ディレクトリにも適用する。

例：

```text
drizzle/
migrations/
```

リポジトリルートのAGENTS.mdも同時に適用する。

本AGENTS.mdは特に、

- Database設計
- Table設計
- Column設計
- Relation
- Constraint
- Index
- Migration
- Query
- Transaction
- Data integrity
- Neon接続
- Serverless DB運用

について優先する。

---

# Database Platform

このプロジェクトでは、

Neon Postgres

を正式なDatabaseとして使用する。

NeonはVercel Marketplace経由でVercel Projectへ接続する。

独自にPostgreSQL Serverを構築しない。

旧Vercel Postgresを新規Databaseとして採用しない。

Database構成は、

```text
Next.js
    ↓
Vercel
    ↓
Vercel Marketplace
    ↓
Neon Postgres
```

を基本とする。

---

# Why Neon Postgres

このプロジェクトでは、Vercel上で動作するNext.js Applicationとの親和性を重視する。

Databaseは以下の条件を満たすものとしてNeon Postgresを採用する。

```text
PostgreSQL互換

Serverless環境対応

Vercel Marketplace連携

Environment Variableによる接続

Connection Pooling対応

Development / Preview環境へ拡張しやすい

Migration管理が可能

Relational Databaseとして利用可能
```

Database Providerを抽象化するためだけの不要なAdapterは作らない。

ただしApplication全体がNeon固有APIへ直接依存しない設計を維持する。

---

# Vercel Integration

Neon Databaseは原則としてVercel MarketplaceからProjectへ接続する。

Database CredentialはVercel Environment Variablesとして管理する。

Connection StringをSource Codeへ直接記述してはならない。

以下のような構成を基本とする。

```text
Vercel Project
      │
      │ Environment Variables
      ▼
Next.js Server
      │
      ▼
Neon Postgres
```

---

# Database Connection

Databaseへの接続処理は、

```text
src/lib/db/
```

へ集約する。

例：

```text
src/
└── lib/
    └── db/
        ├── AGENTS.md
        ├── index.ts
        ├── schema/
        └── queries/
```

Database Clientを複数箇所で初期化しない。

---

# Environment Variables

Database CredentialはEnvironment Variableとして管理する。

概念的には、

```text
DATABASE_URL
```

をApplication側の標準Database Connectionとして扱う。

Providerが追加のEnvironment Variableを生成する場合でも、Application全体へProvider固有Environment Variableを散在させない。

可能な限り、

```text
src/lib/db/index.ts
```

でDatabase Connectionを吸収する。

---

# Server Only

Database接続は必ずServer Sideで行う。

以下から直接Databaseへ接続してはならない。

```text
Client Component

Browser JavaScript

Public API key

NEXT_PUBLIC_* Environment Variable
```

Database CredentialをClient Bundleへ含めない。

---

# Database Purpose

Databaseの役割は、

「ユーザーによって変化する動的データを永続化すること」

である。

このプロジェクトではDatabaseをCMSとして使用しない。

---

# Data Responsibility

データの責務を明確に分離する。

```text
content/curriculum/*.json
        ↓
学習体系

content/articles/*.md
        ↓
学習記事

Neon Postgres
        ↓
ユーザー固有データ
AI Cache
学習履歴

Gemini API
        ↓
AI生成
```

静的コンテンツとユーザーデータを混在させない。

---

# Static Content

以下は原則としてNeonへ保存しない。

```text
資格体系

科目体系

Category

Unit

記事Markdown

記事本文

Curriculum JSON
```

これらのSource of TruthはGit Repositoryとする。

---

# Dynamic Data

Neonへ保存するのは主として以下とする。

MVP：

```text
User

Vocabulary

AIExplanationCache
```

将来的に必要になった場合：

```text
ArticleProgress

Bookmark

Note

LearningHistory

StudySession

ReviewHistory

QuizResult
```

将来利用する可能性だけを理由にTableを作らない。

---

# Minimal Schema Principle

Schemaは小さく始める。

必要になった時点で拡張する。

以下を禁止する。

```text
将来用Columnの大量追加

将来用Tableの大量追加

用途不明のJSON Column

すべてのColumnをNullableにすること
```

現在のApplication要件を正確に表現することを優先する。

---

# Initial Domain Model

MVPでは、

```text
User

Vocabulary

AIExplanationCache
```

を基本Domainとする。

概念上、

```text
User
 │
 │ 1
 │
 │ N
 ▼
Vocabulary


AIExplanationCache
```

とする。

AIExplanationCacheはSystem Owned Dataとして扱う。

---

# Authentication Dependency

User Tableは認証方式が確定してから最終設計する。

ユーザー認証をまだ導入していない場合、認証Libraryが要求するTableを推測で作らない。

Authentication Provider決定後に、

```text
User
Account
Session
Verification
```

など必要なSchemaを設計する。

---

# User

UserはApplication利用者を表す。

概念的には、

```text
id

email

name

created_at

updated_at
```

程度を基本とする。

Authentication Providerが管理する情報とApplication独自Profileを混同しない。

---

# Vocabulary

Vocabularyは、ユーザーが記事閲覧中に保存した専門用語を表す。

最低限、

```text
id

user_id

term

explanation

article_id

created_at

updated_at
```

を管理する。

---

# Vocabulary Snapshot

Vocabularyへ保存するexplanationは、

「ユーザーが保存した時点のAI説明」

のSnapshotとして扱う。

VocabularyがAIExplanationCacheだけを参照する設計にしない。

AI Cacheが後から更新されても、ユーザーが以前保存した単語帳の説明が勝手に変化しないようにする。

---

# Vocabulary Future Fields

将来的に必要になった場合のみ、

```text
memo

favorite

understanding_level

review_count

last_reviewed_at

next_review_at
```

を追加する。

MVPで先回りして追加しない。

---

# Vocabulary Identity

同一Userが同一Termを保存する場合でも、

記事Contextによって意味や説明が変わる可能性を考慮する。

したがって、

```text
term
```

だけをUniqueにしない。

重複保存を禁止する場合は、

```text
user_id
article_id
term
```

などのComposite Unique Constraintを検討する。

実際のProduct仕様を確認してから設定する。

---

# AIExplanationCache

Gemini APIによって生成された用語説明をCacheする。

最低限、

```text
id

term

article_id

context_hash

model

prompt_version

response

created_at
```

を保持できるようにする。

---

# AI Cache Purpose

AIExplanationCacheの目的は、

Gemini APIを同じ条件で何度も呼び出すことを防ぐこと

である。

Applicationの正式な記事データとして扱わない。

---

# AI Cache Identity

Cache Identityは概念的に、

```text
term
+
article_id
+
context_hash
+
model
+
prompt_version
```

から判断する。

モデル変更後やPrompt変更後に古いCacheを誤利用しない。

---

# Context Hash

Geminiへ渡す周辺ContextからHashを生成できるようにする。

概念的には、

```text
surroundingContext
      ↓
Hash
      ↓
context_hash
```

とする。

文章そのものをDatabase検索Keyとして使用しない。

---

# Article Reference

Article本文はDatabaseへ保存しない。

VocabularyなどからArticleを参照する場合、

```text
article_id
```

を文字列として保存する。

article_idは、

```text
content/curriculum/smec.json
```

に定義されたUnit IDと対応させる。

---

# No Article Foreign Key

ArticleはDatabase Tableではないため、

```text
article_id
```

へDatabase Foreign Keyを設定しない。

Application LayerでCurriculumとの整合性をValidationする。

---

# Stable ID

外部静的データをDatabaseから参照する場合、

```text
id
```

を使用する。

以下をDatabase上のIdentityとして使用しない。

```text
title

表示名
```

slugはURL用途として扱う。

可能な限りDatabase Referenceには安定したIDを使用する。

---

# Primary Key

Database TableのPrimary Keyには、Application側でも安全に生成できるIDを使用する。

UUID等を基本候補とする。

Primary KeyへBusiness Meaningを持たせすぎない。

---

# Naming Convention

Database側は原則として、

```text
snake_case
```

を使用する。

例：

```text
user_id

article_id

context_hash

prompt_version

created_at

updated_at
```

TypeScript側では、

```text
camelCase
```

を使用してよい。

---

# Table Naming

Table名はプロジェクト全体で統一する。

複数形を使用する場合はすべて複数形にする。

例：

```text
users

vocabularies

ai_explanation_cache
```

Naming Ruleを途中で混在させない。

---

# Timestamp

更新可能な主要Tableでは原則として、

```text
created_at

updated_at
```

を持たせる。

履歴系Tableなど更新されないものではupdated_atを必須にしない。

---

# Time

Database内部では日時を一貫した形式で保存する。

タイムゾーンを考慮できるPostgreSQL timestamp typeを使用する。

Application表示時にUser Localeへ変換する。

日本時間のFormatted StringをDatabaseへ保存しない。

---

# Nullability

値が必須なら、

```text
NOT NULL
```

を使用する。

Nullableを初期値代わりに乱用しない。

```text
NULL
```

と、

```text
""
```

を同じ意味として使用しない。

---

# Default Value

Default Valueには明確な意味を持たせる。

意味不明な、

```text
status = 0
```

などを作らない。

数値Stateを使用する場合は意味を明確に定義する。

---

# Foreign Keys

Neon内のTable同士では、必要なRelationにForeign Keyを使用する。

例：

```text
vocabularies.user_id
        ↓
users.id
```

Application LayerだけでRelation Integrityを管理しない。

---

# Unique Constraint

Business Rule上、重複してはいけないデータにはDatabase側にもUnique Constraintを設定する。

Applicationで、

```text
SELECT
↓
存在確認
↓
INSERT
```

だけを行って重複防止しない。

Race Conditionを考慮する。

---

# Check Constraint

値の範囲が明確な場合はCheck Constraintを検討する。

例えば、

```text
understanding_level
```

が1〜5と決まっている場合、

Database側でも、

```text
1 <= understanding_level <= 5
```

を保証する設計を検討する。

---

# Index

Indexは実際のQuery Patternに基づいて設計する。

候補：

```text
vocabularies.user_id

vocabularies.article_id

ai_explanation_cache.context_hash
```

必要に応じてComposite Indexを使用する。

---

# Composite Index

例えば、

```text
WHERE user_id = ?
AND article_id = ?
```

というQueryが多い場合、

```text
(user_id, article_id)
```

のIndexを検討する。

---

# Avoid Excessive Indexes

すべてのColumnへIndexを作らない。

IndexはRead Performanceを改善する一方で、

```text
Write Cost

Storage

Maintenance
```

を増加させる。

Query Patternを確認して必要なIndexだけ追加する。

---

# Serverless Connection Management

Vercel FunctionsとNeonのようなServerless環境ではDatabase Connection数に注意する。

リクエストごとに無制限に新しいConnectionを作る設計を避ける。

採用するDriverまたはConnection方式について、

```text
Serverless対応

Connection Pooling

Neon推奨方式

Vercel Runtimeとの互換性
```

を確認する。

---

# Connection Pooling

Connection Poolingを利用可能な場合はServerless環境に適した接続方式を優先する。

独自の長時間Persistent Connectionを前提にした設計を避ける。

---

# Neon Specific Features

Neon固有機能は便利であっても、必要性がない段階でApplication Architectureへ深く組み込まない。

例えば、

```text
Database Branching

Read Replica

Point-in-Time Recovery
```

などは必要になった時点で導入する。

MVPでは通常のPostgreSQLとして利用することを優先する。

---

# Preview Environments

将来的にVercel Preview DeploymentとDatabase Branchを連携する場合は、

Production DataへPreview環境から誤って書き込まない構成を優先する。

Preview Database戦略を導入するまでは、本番Databaseを安全に扱う。

---

# Data Access Layer

Database QueryをReact Componentへ直接記述しない。

基本構造：

```text
UI

↓

Server Action / Route Handler

↓

Repository / Data Access Layer

↓

Neon Postgres
```

とする。

---

# Repository

Feature固有QueryはRepositoryへ集約してよい。

例：

```text
src/
└── features/
    └── vocabulary/
        └── repository.ts
```

Repository FunctionはApplication上の意味が分かる名前にする。

例：

```text
findVocabularyByUser()

findVocabularyByArticle()

saveVocabulary()

deleteVocabulary()
```

---

# Raw Database Client

Neon ClientまたはORM ClientをApplication全体へ公開しない。

Clientの利用箇所をDatabase Layerへ限定する。

以下のような構造を避ける。

```text
React Component
   ↓
Neon Client
```

---

# Query Design

Queryでは必要なColumnだけ取得する。

不要な、

```text
SELECT *
```

を常用しない。

大量Recordを無条件で全件取得しない。

---

# N+1 Query

Relation Dataを取得するときはN+1 Queryへ注意する。

Loop内部からDatabase Queryを繰り返す設計を避ける。

---

# Pagination

Vocabulary、HistoryなどUser Dataが増加する可能性があるTableでは、将来的にPaginationを導入できる構造にする。

大量データを一括取得しない。

必要になった場合、

```text
LIMIT

Cursor
```

などを利用する。

---

# ORM

ORM導入の有無はImplementation開始時の要件に応じて判断する。

特定ORMをApplication Domainへ直接依存させない。

採用時には、

```text
Next.js

Vercel

Neon

PostgreSQL

Serverless

Migration

TypeScript
```

との互換性を確認する。

---

# ORM Isolation

ORMを使用しても、

```text
UI
↓
ORM
```

と直接接続しない。

```text
UI
↓
Server Layer
↓
Repository
↓
ORM
↓
Neon
```

とする。

---

# Raw SQL

Raw SQLは禁止しない。

複雑なQueryやPerformance上必要な場合に利用できる。

ただし、

```text
SQL Injection

Parameter Binding

Type Safety

Readability
```

に注意する。

User Inputを文字列結合してSQLを作らない。

---

# Transactions

複数のDatabase操作が、

「全部成功するか、全部失敗するか」

であるべき場合はTransactionを使用する。

単純なSingle INSERTへ不必要なTransactionを追加しない。

---

# Idempotency

Server ActionやAPI Retryによって同じRequestが再実行される可能性を考慮する。

重複INSERTを防ぐ必要がある場合、

```text
UNIQUE

UPSERT
```

などを利用する。

---

# Upsert

Upsertは既存Dataを上書きしてよい場合だけ使用する。

便利だからという理由だけで利用しない。

Vocabularyの保存とAI CacheではUpdate Ruleが異なる可能性があるため、Domainごとに判断する。

---

# Data Ownership

各TableについてOwnerを明確にする。

```text
Vocabulary
→ User Owned

Note
→ User Owned

ArticleProgress
→ User Owned

AIExplanationCache
→ System Owned
```

OwnerによってAuthorizationとDelete Ruleを決定する。

---

# Authorization

AuthenticationとAuthorizationを区別する。

Loginしているだけでは他User Dataへアクセスできない。

User Owned Dataを取得する場合、

```text
record.id
```

だけではなく、

```text
record.id
+
current_user_id
```

で所有権を確認する。

---

# User Isolation

例えばVocabulary取得では、

```text
findVocabularyById(id)
```

だけではなく、

```text
findVocabularyByIdAndUserId(
  id,
  userId
)
```

のようにUser Ownershipを意識する。

---

# Validation

Databaseへ保存する前にRuntime Validationを行う。

TypeScript TypeだけをValidationとして扱わない。

ZodなどのSchema Validationを利用する。

特に、

```text
term

article_id

memo

Gemini response

URL parameter

User input
```

を検証する。

---

# AI Output Validation

Gemini OutputをそのままDatabaseへ保存しない。

Structured Outputを利用する場合でもValidationする。

想定外ResponseやInvalid JSONを考慮する。

---

# String Length

自由入力Textには適切なLength Limitを設ける。

特に、

```text
term

memo

AI Response

surroundingContext
```

が無制限に大きくならないようにする。

---

# Delete Strategy

Physical DeleteとSoft Deleteは要件に応じて選択する。

すべてのTableへ、

```text
deleted_at
```

を付けない。

AuditやRestore RequirementがなければPhysical Deleteを検討する。

---

# Cascading Delete

CASCADE DELETEを安易に設定しない。

例えばUser削除時に、

```text
Vocabulary

Note

LearningHistory
```

をどう扱うかを確認してから設定する。

---

# User Deletion

将来的にAccount削除を実装する場合、

User Owned Dataを不要に保持しない。

削除対象を明確にする。

---

# Migration

Database Schema変更はMigrationで管理する。

Production SchemaをDashboardから手作業だけで変更する運用にしない。

Migration FileをGit管理する。

---

# Migration Unit

Migrationは小さく意味のある単位にする。

例：

```text
create vocabularies table
```

と、

```text
create ai explanation cache
```

を無関係に1つへまとめない。

---

# Destructive Migration

以下は破壊的Migrationとして慎重に扱う。

```text
DROP TABLE

DROP COLUMN

ALTER COLUMN TYPE

NOT NULL追加

UNIQUE追加
```

既存データへの影響を確認する。

CodexはData Lossを起こす可能性があるMigrationを独断で実行しない。

---

# Rename

TableやColumnをRenameするとき、

```text
DROP
+
CREATE
```

として扱わない。

可能な限り既存Dataを保持するMigrationを使用する。

---

# Production Database

Production Databaseに対するSchema変更は必ずMigrationを通す。

Production Dataを開発用途で直接編集しない。

Vercel DashboardのData EditorやQuery Interfaceを通常のSchema管理手段として使用しない。

それらは確認・調査・緊急対応用途として扱う。

---

# Development Data

開発ではDummy Dataを使用する。

Production User DataをDevelopment Environmentへコピーすることを前提にしない。

---

# Seed

CurriculumやArticleをDatabase Seedへ入れない。

Database Seedは開発やTestに必要なDatabase Dataだけにする。

例：

```text
Development User

Sample Vocabulary
```

---

# JSONB

JSONBは可変構造の補助Dataに使用してよい。

しかし、

「Schemaを設計しなくて済む」

という理由でJSONBを使用しない。

検索、Constraint、Joinが必要なDataは通常Columnを優先する。

---

# Normalization

基本的には適切にNormalizationする。

ただし過剰なNormalizationによって単純なDomainを大量Tableへ分割しない。

例：

Vocabularyの、

```text
term

explanation

created_at
```

を別々のTableへ分ける必要はない。

---

# Denormalization

Historical SnapshotやPerformance上合理的な場合はDenormalizationを許可する。

例えばVocabularyへAI説明Snapshotを保存する設計は許容する。

理由を説明できること。

---

# Cache Responsibilities

以下を区別する。

```text
Neon Postgres
→ Permanent Data

Next.js Cache
→ Rendering / Fetch Cache

AIExplanationCache
→ Gemini Request削減

Browser State
→ Temporary UI State
```

責務を混同しない。

---

# Initial Schema

MVPでは以下を基本Schemaとする。

```text
users
├── id
├── email
├── name
├── created_at
└── updated_at


vocabularies
├── id
├── user_id
├── term
├── explanation
├── article_id
├── created_at
└── updated_at


ai_explanation_cache
├── id
├── term
├── article_id
├── context_hash
├── model
├── prompt_version
├── response
└── created_at
```

ただしAuthenticationをまだ実装しない場合は、

```text
users
```

を先に作らなくてもよい。

---

# Initial Relationship

基本Relation：

```text
users
  │
  │ 1
  │
  │ N
  ▼
vocabularies
```

AIExplanationCacheはSystem Ownedとし、Userと直接Relationを持たせない。

---

# Future Schema

必要になった時点で、

```text
article_progress

bookmarks

notes

learning_history

study_sessions

review_history

quiz_results
```

などを追加する。

MVP時点で作らない。

---

# Database Security

以下を禁止する。

```text
DATABASE_URLのClient公開

Database PasswordのSource Code記述

User InputによるSQL文字列結合

AuthorizationなしのUser Data取得

Production CredentialのGit Commit

Gemini Outputの無検証保存
```

---

# Neon Provider Boundary

Application Domainは、

「PostgreSQL Database」

を前提としてよい。

ただし、

「Neon独自機能が必ず存在する」

という前提をBusiness Logicへ埋め込みすぎない。

Database Provider固有処理はDatabase Layerへ限定する。

---

# New Table Checklist

新しいTableを作る前に確認する。

```text
本当にDBへ保存する必要があるか

JSONまたはMarkdown管理ではないか

User固有DataかSystem固有Dataか

既存Tableで表現できないか

Primary Keyは何か

Ownerは誰か

Foreign Keyは必要か

Unique Ruleは何か

Delete Ruleは何か

主要Queryは何か

Indexは必要か

Migrationは安全か
```

---

# Schema Documentation

新しいTableを追加するときは最低限、

```text
Tableの目的

Data Owner

主要Column

Relation

Unique Constraint

Index

Delete Rule
```

を説明できる状態にする。

---

# Testing

Database関連では特に、

```text
Repository

Validation

Unique Constraint

User Isolation

Article ID Mapping

AI Cache Lookup

Delete Behavior
```

をTestする。

ORMそのものをTestするより、Application上重要なBehaviorをTestする。

---

# Performance

MVP段階では過剰最適化しない。

ただし、

```text
N+1 Query

Unlimited SELECT

大量Recordの全件取得

不要なColumn取得

Connection大量生成
```

を避ける。

---

# Codex Database Workflow

DB変更を行う場合、Codexは以下の順序で作業する。

```text
1.
Root AGENTS.mdを読む

2.
src/lib/db/AGENTS.mdを読む

3.
現在のDatabase Schemaを確認

4.
既存Migrationを確認

5.
関連Repositoryを確認

6.
関連Featureを確認

7.
Database変更の目的を明確化

8.
必要最小限のSchema変更を設計

9.
Constraintを検討

10.
Indexを検討

11.
Migrationを作成

12.
Repositoryを更新

13.
Validationを更新

14.
Testを更新

15.
TypeScript / lint / test / buildを実行

16.
Migration差分をReview
```

---

# Codex Provider Check

Database接続方式、Neon SDK、ORM、Driverなどを追加・更新するときは、

古い記憶だけを根拠にImplementationしない。

その時点の、

```text
Vercel Documentation

Neon Documentation

使用するORM / Driverの公式Documentation
```

を確認する。

Deprecated Packageや旧Vercel Postgres APIを新規導入しない。

---

# Codex Change Policy

Database変更のためだけに無関係なUIを変更しない。

Database変更と大規模Refactorを同時に行わない。

要求されていないTableを追加しない。

要求されていないColumnを追加しない。

将来使うという理由だけでRelationを追加しない。

---

# Codex Schema Change Report

Schemaを変更した場合、Codexは作業終了時に、

```text
追加・変更したTable

追加・変更したColumn

変更理由

Foreign Key

Unique Constraint

Index

Migration

既存Dataへの影響
```

を確認する。

---

# Do Not Do

以下は禁止する。

```text
旧Vercel Postgresを新規Databaseとして採用する

記事本文をNeonへ保存する

Curriculum JSONをNeonへ移す

Client ComponentからNeonへ直接接続する

DATABASE_URLをClientへ公開する

QueryをUI Componentへ直接記述する

External InputをValidationなしで保存する

User IDを確認せずUser Dataを返す

すべてのColumnをNullableにする

すべてのTableへSoft Deleteを導入する

すべてのColumnへIndexを作る

将来用Tableを大量に作る

巨大JSONBだけでDatabaseを構成する

MigrationなしでProduction Schemaを変更する

破壊的Migrationを無確認で実行する
```

---

# Architecture Principle

Database設計では、

「将来何でもできるSchema」

を目指さない。

代わりに、

```text
現在の要件を正確に表現する

↓

ConstraintでData Integrityを守る

↓

Queryが明確になる

↓

ApplicationからDB実装を分離する

↓

必要になった時だけ拡張する
```

という構造を目指す。

---

# Most Important Principle

Databaseは単なる保存場所ではない。

Databaseは、

「Application Dataの意味と整合性を守る仕組み」

として扱う。

必要に応じて、

```text
NOT NULL

UNIQUE

FOREIGN KEY

CHECK

INDEX
```

を使用する。

ただしConstraintを増やすこと自体を目的にしない。

---

# Final Instruction to Codex

このProjectのDatabaseは、

Vercel Marketplace経由で接続するNeon Postgres

を標準とする。

旧Vercel Postgresを前提とした新規Implementationを行わない。

Database変更では、

「将来使うかもしれない」

ではなく、

「現在どのDataを、なぜ保存する必要があるか」

を優先する。

静的学習コンテンツとUser Dataを混在させない。

DatabaseをUIへ直接接続しない。

Repository / Data Access LayerをDatabase境界として使用する。

Neon固有機能へApplication全体を過度に依存させない。

Schemaは小さく始める。

必要になった時点でMigrationによって拡張する。

最終的な判断基準は、

「このSchemaは現在のDataの意味を正確に表現し、Vercel + NeonのServerless環境で安全かつ単純に運用できるか」

である。