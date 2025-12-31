# コントリビューションガイド

webpify へのコントリビューションを歓迎します。

## 開発環境

### 必要なもの

- Node.js 24.0.0 以上
- pnpm 10.26.0 以上

### セットアップ

```bash
git clone https://github.com/semba-yui/webpify.git
cd webpify
pnpm install
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `pnpm build` | TypeScript をコンパイル |
| `pnpm dev` | ファイル変更を監視してコンパイル |
| `pnpm test` | テスト実行 |
| `pnpm test:watch` | テスト監視モード |
| `pnpm test:coverage` | カバレッジ測定 |
| `pnpm lint` | リント実行 |
| `pnpm lint:fix` | リント自動修正 |
| `pnpm typecheck` | 型チェック |

## コーディング規約

- **リンター:** Biome
- **言語:** TypeScript（strict モード）
- **モジュール:** ESM

`pnpm lint` でスタイルを確認してください。

## テスト方針

- TDD（テスト駆動開発）で実装
- Given-When-Then パターンでテストを記述
- カバレッジ目標: 90%

```typescript
// テストコメントの例
// Given: 有効なPNGファイルパス
// When: convert関数を呼び出す
// Then: WebPファイルが生成される
```

## Issue の作成

- バグ報告: 再現手順、期待される動作、実際の動作を記載
- 機能提案: ユースケースと期待される動作を記載

## プルリクエスト

1. Issue を作成または確認
2. フォークしてブランチを作成
3. 変更を実装（テスト含む）
4. `pnpm test` と `pnpm lint` が通ることを確認
5. プルリクエストを作成

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) 形式に従ってください。

```text
feat: 新機能の説明
fix: バグ修正の説明
docs: ドキュメント変更
test: テスト追加・修正
refactor: リファクタリング
```

commitlint で自動検証されます。
