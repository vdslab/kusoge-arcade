# Kusoge Arcade — 開発ガイドライン (AGENTS.md)

このリポジトリは、ブラウザで遊べるクソゲーを 1 ゲーム = 1 ディレクトリ（`games/<slug>/`）で追加していく静的格納庫です。

## 1. 開発フロー（2段階承認・厳守）

1. **企画・仕様の事前提示**:
   - 新規ゲームの追加や大きな機能改修の依頼を受けたら、**いきなり実装やブランチ作成を始めず**、まずスレッド内で簡潔な企画・仕様案を提示してください：
     - タイトル / `slug`（小文字 kebab-case）
     - 一言コンセプト・ルール（1 プレイ 15〜60 秒で完結するテンポ推奨）
     - 操作方法（PC キーボード/マウス ＋ スマホのタッチ操作）
     - 使用技術（基本はプレーン HTML/CSS/JS + Canvas。別構成を使う場合は理由を明記）
     - テスト観点（`logic.test.js` の単体テスト項目と `e2e.spec.mjs` の操作シナリオ）
2. **承認後に実装〜PR 作成**:
   - 人間から OK（実装指示）が出たら、最新の `main` から作業ブランチ（例: `feat/<slug>`, `fix/...`）を切り、実装・検証・PR 作成まで完走してください。

## 2. 技術方針とゲーム単位の制約

- **基本スタック**: ビルド不要のプレーンな **HTML / CSS / JavaScript（ES Modules）＋ Canvas 中心** を基本とします。
- **ゲームごとの自由度**: ゲームの性質上ほかの構成を選びたい場合は、その `games/<slug>/` 内で完結し、`games/<slug>/index.html` として静的配信で動作する形にしてください。
- **外部アセット・CDN 禁止**: 外部画像・外部音声・外部 CDN スクリプトに依存せず、グラフィックは Canvas / SVG / CSS、効果音や BGM は Web Audio API（ミュート切替つき）でコード完結させてください。
- **スマホ対応必須**: `viewport` 設定を行い、`390x844` のモバイル画面で横スクロールが発生せず、タッチ／ポインター操作で最後まで遊べること。
- **必須 UI 要素**:
  - 格納庫トップへ戻るリンク（`<a href="../../">← 格納庫へ戻る</a>`）
  - タイトル / プレイ中 / ゲームオーバー＆リトライの明確な状態遷移
  - `localStorage` を使う場合はキーに `kusoge:<slug>:` プレフィックスを付けること

## 3. 新規ゲームの必須ファイル（`games/<slug>/`）

`games/_template/` およびお手本実装 `games/tap-panic/` を参照し、以下を揃えてください：

- `meta.json`:
  ```json
  {
    "slug": "your-game-slug",
    "title": "ゲームタイトル",
    "tagline": "一言でわかるクソゲー紹介",
    "controls": "クリック / タップ / Space",
    "tags": ["canvas", "action"],
    "author": "Hermes Factory",
    "createdAt": "2026-11-20"
  }
  ```
- `index.html`, `style.css`, `main.js`
- `logic.js`: DOM に依存しない純粋なゲーム状態・判定ロジック
- `logic.test.js`: Vitest 単体テスト（初期化・操作・スコア・終了/リトライ等の重要挙動を検証）
- `e2e.spec.mjs`: Playwright 操作 E2E テスト（スタート → 実際の操作入力 → スコアまたは状態変化 → リトライ遷移まで PC またはモバイルで検証）

## 4. コンフリクト防止ルール

- `games-manifest.json` はビルド・CI 時に自動生成され `.gitignore` されています。**手動編集・コミットしないでください**。
- 新規ゲーム追加 PR では、原則として `games/<slug>/` 配下のみを追加してください（格納庫本体への変更は別 PR とします）。

## 5. 完了条件・PR 作成ルール

- PR 作成前に必ず `npm run verify` を実行し、以下すべてが PASS することを確認してください：
  1. `npm run manifest`（`meta.json`・必須ファイル検証）
  2. `npm run test:unit`（Vitest 全件 PASS）
  3. `npm run test:e2e`（Playwright 共通スモーク〔PC/モバイル・エラー0件・横はみ出しなし・スクショ生成〕＋ゲーム固有 E2E 全件 PASS）
- `main` への直接コミット・force-push・自己マージは禁止です。
- PR 本文（および Discord 完了報告）には、**変更概要・操作方法・`npm run verify` の結果・生成されたスクリーンショット情報（`test-results/screenshots/` や CI artifact）**を簡潔に記載してください。
