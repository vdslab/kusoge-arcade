# Kusoge Arcade

`vdslab` のブラウザベース・クソゲー格納庫です。`main` ブランチへマージされると GitHub Pages へ自動公開されます。

- 公開 URL: https://vdslab.github.io/kusoge-arcade/

## ローカルでの起動・検証

```bash
npm install
npm run manifest
npm run serve
```

全自動検証（マニフェスト検証・Vitest 単体テスト・Playwright 共通スモーク＆各ゲーム E2E）:

```bash
npm run verify
```

## ディレクトリ構成

- `index.html`, `hub/`: 格納庫トップページ
- `games/_template/`: 新規ゲーム作成用テンプレート
- `games/<slug>/`: 各ゲーム本体（基本はプレーンな HTML / CSS / JS・Canvas 中心。必要に応じてゲームごとに独自構成も選択可能）
- `scripts/build-manifest.mjs`: `games/*/meta.json` から一覧マニフェストを自動生成
- `tests/smoke.spec.mjs`: 格納庫および全ゲームの PC / モバイル共通スモーク検証
